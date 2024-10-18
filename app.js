import dotenv from 'dotenv';
import express from "express";
import cors from "cors";
import "./db/cone.js"
import session from 'express-session';
import passport from "passport";
import { Strategy as OAuth2Strategy } from "passport-google-oauth20";
import {User} from "./models/userschema.js";
import { GoogleGenerativeAI } from '@google/generative-ai';
import { v4 as uuidv4 } from 'uuid';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import isAuthenticated from "./middleware/checkAuth.js";
import userRouter from "./routes/userRouter.js";
import postRouter from "./routes/postRouter.js";

const app = express();
const port = 3200;

dotenv.config();
app.use(bodyParser.json());
app.use(cors({
  origin: 'http://localhost:5173', // Update with your React app's URL
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true // Allow cookies to be sent with requests
}));
app.use(express.json());
app.use(session({
  secret:process.env.SEC,
  resave: false,
  saveUninitialized: true
}));
app.use(passport.initialize());


app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/users", userRouter);
app.use("/api/posts",postRouter);

const oauth2StrategyLogIn = new OAuth2Strategy({
  clientID:process.env.CLIENT_ID_SIGNIN,
  clientSecret: process.env.CLIENT_SECRET_SIGNIN,
  callbackURL: "http://localhost:3200/auth/google/signin/callback", // Corrected URL
  scope: ["profile", "email"]
}, async (accessToken, refreshToken, profile, done) => {
  try {
    return done(null, profile);
  } catch (error) {
    return done(error, null);
  }
});

const oauth2StrategySignUp = new OAuth2Strategy({
    clientID:process.env.CLIENT_ID_SIGNUP,
    clientSecret: process.env.CLIENT_SECRET_SIGNUP,
    callbackURL: "http://localhost:3200/auth/google/signup/callback", // Corrected URL
    scope: ["profile", "email"]
  }, async (accessToken, refreshToken, profile, done) => {
    try {
        
      return done(null, profile);
    } catch (error) {
      return done(error, null);
    }
  });

passport.serializeUser((user, done) => {done(null, user); }); 
passport.deserializeUser((user, done) => {  done(null, user);});
  

passport.use("google-signin",oauth2StrategyLogIn);
app.get("/auth/google/signin", passport.authenticate("google-signin", { scope: ["profile", "email"] }));

app.get("/auth/google/signin/callback", passport.authenticate("google-signin", {session:false}),
async(req,res)=>{   
  const email=req.user.emails[0].value;
  let user=await User.findOne({email});
  if(!user){
    const uniqueUsername = `${req.user.displayName.replace(/\s/g, '').toLowerCase()}_${uuidv4().slice(0, 8)}`;
  const username=uniqueUsername;
  const name=req.user.displayName;
  const profileimg=req.user.photos[0].value;
  user=await User.create({username, email,name,profileimg});   
  }
  const accessToken=user.generateAccessToken();
  const options = {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    httpOnly: true,
    path: '/',
    secure: true,
    sameSite: 'None'
  }; 
  res.cookie("accessToken",accessToken,options)  ;
  res.redirect(`http://localhost:5173/Interview-Mate-frontend/profile`)  
});



passport.use("google-signup",oauth2StrategySignUp);
app.get("/auth/google/signup", passport.authenticate("google-signup", { scope: ["profile", "email"] }));

app.get("/auth/google/signup/callback", passport.authenticate("google-signup", {session:false}),
async(req,res)=>{   
  const email=req.user.emails[0].value;
  let user=await User.findOne({email});
  if(!user){
  const uniqueUsername = `${req.user.displayName.replace(/\s/g, '').toLowerCase()}_${uuidv4().slice(0, 8)}`;
  const username=uniqueUsername;
  const name=req.user.displayName;
  const profileimg=req.user.photos[0].value;
  user=await User.create({username, email,name,profileimg});    
  }
  const accessToken=user.generateAccessToken();
  const options = {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    httpOnly: true,
    path: '/',
    secure: true,
    sameSite: 'None'
  }; 
  res.cookie("accessToken",accessToken,options) ;
  res.redirect(`http://localhost:5173/Interview-Mate-frontend/profile/`)  
});

app.get('/login/success', isAuthenticated, (req, res) => {
  if(req.user){
     res.status(200).json({ message: "Login success", user: req.user });
  }
  else res.status(400).json({ message: "not authenticated"}); 
});


//speech by google

const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error('API_KEY is not defined in environment variables.');
}
const genAI = new GoogleGenerativeAI(apiKey);

const INITIAL_PROMPT = "You are the interviewer in an interview. Ask me questions one by one. And donnt stick to one topic  and try to generate different question for make feel like real interview and try to cover all aspect in 10 to 15 question";

// Store data for each session
const sessionData = {};
const interview_results = {};  // Define the interview_results object

async function generate_response(query, conversation_history, initial_prompt = INITIAL_PROMPT) {
    const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
    });

    const current_conversation = conversation_history.slice(-10).concat([`user: ${query}`]).join('\n');
    const full_prompt = `${initial_prompt}\n${current_conversation}`;
    
    try {
        const result = await model.generateContent(full_prompt);

        if (result && result.response && result.response.candidates && result.response.candidates.length > 0) {
            const textContent = result.response.candidates[0].content.parts[0].text;
            conversation_history.push(`ai: ${textContent}`);
            return textContent;
        } else {
            console.error('Invalid API response:', result);
            return 'Sorry, I couldn\'t generate a response.';
        }
    } catch (error) {
        console.error('Error generating response:', error);
        return 'An error occurred while generating the response.';
    }
}

async function evaluate_answer(question, answer) {
    const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
    });

    const prompt = `Question: ${question}\nAnswer: ${answer}\nEvaluate the above answer as an interview response. Provide a rating (Excellent, Good, Average, Poor) and explain why.`;

    try {
        const result = await model.generateContent(prompt);

        if (result && result.response && result.response.candidates && result.response.candidates.length > 0) {
            const evaluation_text = result.response.candidates[0].content.parts[0].text;
            let rating = "Average";
            if (evaluation_text.includes("Excellent")) {
                rating = "Excellent";
            } else if (evaluation_text.includes("Good")) {
                rating = "Good";
            } else if (evaluation_text.includes("Poor")) {
                rating = "Poor";
            }
            return { rating, evaluation_text };
        } else {
            console.error('Invalid API response:', result);
            return { rating: "Average", evaluation_text: 'Unable to evaluate.' };
        }
    } catch (error) {
        console.error('Error evaluating answer:', error);
        return { rating: "Average", evaluation_text: 'An error occurred while evaluating the answer.' };
    }
}

app.post('/api/gemini', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const session_id = req.sessionID;

    // Initialize session data if not already present
    if (!sessionData[session_id]) {
        sessionData[session_id] = {
            qsns: 0,
            conversation_history: [],
            responses: [],
            generated_questions: [],
            flag: 0,
            prev_ques: "",
        };
    }

    const { qsns, conversation_history, responses, generated_questions, flag, prev_ques } = sessionData[session_id];
    const user_message = req.body.message;

    if (!user_message) {
        return res.json({ response: 'Kindly Say hi to start' });
    }

    try {
        let current_question = await generate_response(user_message, conversation_history);
        generated_questions.push(current_question);

        if (flag !== 0) {
            conversation_history.push(`user: ${user_message}`);
            const { rating, evaluation_text } = await evaluate_answer(prev_ques, user_message);

            const response_entry = {
                question: prev_ques,
                answer: user_message,
                rating: rating,
                evaluation: evaluation_text,
            };

            responses.push(response_entry);
        }

        sessionData[session_id].qsns++;
        sessionData[session_id].prev_ques = current_question;
        sessionData[session_id].flag = 1;

        if (sessionData[session_id].qsns >= 6) {  // End after 5 questions
            interview_results[session_id] = responses.slice();
            sessionData[session_id] = {
                qsns: 0,
                conversation_history: [],
                responses: [],
                generated_questions: [],
                flag: 0,
                prev_ques: "",
            };
            const redirect_url = "http://localhost:5173/Interview-Mate-frontend/result/";
            return res.json({
                response: current_question,
                redirect: redirect_url
            });
        }

        return res.json({ response: current_question, session_id });
    } catch (error) {
        console.error('Error processing request:', error);
        return res.status(500).json({ response: `Error: ${error.message}` });
    }
});

app.get('/result/:session_id', isAuthenticated, (req, res) => {
    const session_id = req.sessionID;
    const results = interview_results[session_id];

    if (results) {
        return res.json({ results });
    } else {
        return res.status(404).json({ response: 'Session not found' });
    }
});


//endgoogle

app.get('/',(req,res) =>{
 res.write("<h1>Hi Bibhuti Ranjan </h1>");
})
app.listen(port,(error)=>{
 if(!error){
    console.log("🎉Successfully conntected to server ");
 }
 else console.log("Error connecting" ,error);
});
