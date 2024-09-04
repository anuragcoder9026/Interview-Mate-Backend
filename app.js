require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
require("./db/cone")
const session  = require('express-session');
const passport = require("passport");
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const userdb = require("./models/userschema")
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser');
const port = 3200;

const clientid = process.env.CLIENT_ID;
const clientsecret = process.env.CLIENT_SEC;


//middleware
app.use(bodyParser.json());

app.use(cors({
    origin: "http://localhost:5173",
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
}));

app.use(express.json());

app.use(session({
    secret: process.env.SEC,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());

// Middleware to check if the user is authenticated
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
      return next(); // If authenticated, proceed to the next middleware/route handler
  } else {
      return res.status(401).json({ message: "Please log in to continue." });
  }
}

//use passport

passport.use(
    new GoogleStrategy({
        clientID: clientid,
        clientSecret: clientsecret,
        callbackURL: "http://localhost:3200/api/auth/callback/google",
        scope: ["email", "profile"],
    },
    async (accessToken, refreshToken, profile, done) => {
        console.log(profile.id);
        try {
            let user = await userdb.findOne({ google_id: profile.id });
            if (!user) {
                user = new userdb({
                    google_id: profile.id,
                    Name: profile.displayName,
                    email: profile.emails[0].value,
                    profileimg: profile.photos[0].value,
                });
                await user.save();
            }
            done(null, user); // Call done with user object
        } catch (error) {
            done(error, null);
        }
    })
);


//serialise deserliase


passport.serializeUser((user, done) => {
    done(null, user.id); // Serialize user ID
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await userdb.findById(id); // Fetch user by ID
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});


//google auth

app.get('/auth/google', passport.authenticate('google', { scope: ['email', 'profile'] }));

app.get('/api/auth/callback/google',
    passport.authenticate('google', {
        failureRedirect: 'http://localhost:5173/Interview-Mate-frontend/',
    }), (req, res) => {
        if (!req.user) {
            return res.status(401).json({ error: "Authentication failed" });
        }
        console.log("User authenticated successfully, redirecting...");
        res.redirect('http://localhost:5173/Interview-Mate-frontend/profile');
    }
);



app.get('/login/success',(req,res)=>{
    console.log("login success hit",req.user);
    if(req.user){
        res.status(200).json({message:"login success",lebhaidata:req.user})

    }else{
        res.status(400).json({message:"Not Authorised"});
    }
})
//logut
app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect('http://localhost:5173/Interview-Mate-frontend/');
    });
});


//speech by google

const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error('API_KEY is not defined in environment variables.');
}

// Initialize GoogleGenerativeAI with the API key
//const genAI = new GoogleGenerativeAI(apiKey);

// let qsns = 0;
// let conversation_history = [];
// let responses = [];
// let generated_questions = [];
// let interview_results = {};

// const INITIAL_PROMPT = "You are the interviewer in an interview. Ask me questions one by one.";

// async function generate_response(query, initial_prompt = INITIAL_PROMPT) {
//   global.conversation_history;
//   const model = genAI.getGenerativeModel({
//     model: 'gemini-1.5-flash',
//   });

//   const current_conversation = conversation_history.slice(-2).concat([`user: ${query}`]).join('\n');
//   const full_prompt = `${initial_prompt}\n${current_conversation}`;
  
//   try {
//     const result = await model.generateContent(full_prompt);

//     // Check if response is valid
//     if (result && result.response && result.response.candidates && result.response.candidates.length > 0) {
//       const textContent = result.response.candidates[0].content.parts[0].text;
//       conversation_history.push(`ai: ${textContent}`);
//       return textContent;
//     } else {
//       console.error('Invalid API response:', result);
//       return 'Sorry, I couldn\'t generate a response.';
//     }
//   } catch (error) {
//     console.error('Error generating response:', error);
//     return 'An error occurred while generating the response.';
//   }
// }

// async function evaluate_answer(question, answer) {
//   const model = genAI.getGenerativeModel({
//     model: 'gemini-1.5-flash',
//   });

//   const prompt = `Question: ${question}\nAnswer: ${answer}\nEvaluate the above answer as an interview response. Provide a rating (Excellent, Good, Average, Poor) and explain why.`;

//   try {
//     const result = await model.generateContent(prompt);

//     if (result && result.response && result.response.candidates && result.response.candidates.length > 0) {
//       const evaluation_text = result.response.candidates[0].content.parts[0].text;
//       let rating = "Average";
//       if (evaluation_text.includes("Excellent")) {
//         rating = "Excellent";
//       } else if (evaluation_text.includes("Good")) {
//         rating = "Good";
//       } else if (evaluation_text.includes("Poor")) {
//         rating = "Poor";
//       }
//       return { rating, evaluation_text };
//     } else {
//       console.error('Invalid API response:', result);
//       return { rating: "Average", evaluation_text: 'Unable to evaluate.' };
//     }
//   } catch (error) {
//     console.error('Error evaluating answer:', error);
//     return { rating: "Average", evaluation_text: 'An error occurred while evaluating the answer.' };
//   }
// }

// let flag = 0;
// let prev_ques = "";
// app.post('/api/gemini', async (req, res) => {
//   if (!req.isAuthenticated()) {
//     return res.status(401).json({ error: 'Unauthorized' });
// }
//   global.qsns, conversation_history, responses, generated_questions;
//   const user_message = req.body.message;
//   if(!user_message){
//     return res.json({ response: 'Kindly Say hi to start'  });
//   }

//   try {
//       let current_question;
      
//           current_question = await generate_response(user_message);
//           generated_questions.push(current_question);
      

//       // Push AI question to the conversation history
//       conversation_history.push(`ai: ${current_question}`);
      


//       // If the user has responded, evaluate their answer
//       if (user_message && flag!=0) {
//           conversation_history.push(`user: ${user_message}`);
//           const { rating, evaluation_text } = await evaluate_answer(prev_ques, user_message);
          
//           const response_entry = {
//               question: prev_ques,
//               answer: user_message,
//               rating: rating,
//               evaluation: evaluation_text
//           };
          
//           responses.push(response_entry);
//           ai_response = await generate_response(user_message);
//           generated_questions.push(ai_response);
         
//       }
//       qsns++;
//       const session_id = req.sessionID;
//       if (qsns >= 6) {  // End after 5 questions
//           interview_results[session_id] = responses.slice();
//           qsns = 0;
//           flag = 0;
//           conversation_history = [];
//           responses = [];
//           generated_questions = [];
//           const redirect_url = `http://localhost:3200/result/${session_id}`;

//           return res.json({
//               response: current_question ,
//               redirect: redirect_url
//           });
//       }

//       //bakki sare case ke liye
//      else{
//       prev_ques = current_question;
//       flag = 1;
//      }

     
//       return res.json({ response: current_question , session_id  });
//   } catch (error) {
//       console.error('Error processing request:', error);
//       return res.status(500).json({ response: `Error: ${error.message}` });
//   }
// });


// app.get('/result/:session_id',isAuthenticated, (req, res) => {
//   const session_id = req.sessionID;
//   const results = interview_results[session_id];
//   console.log("result :",results);
//   console.log(responses);
//   if (responses) {
//     return res.json({ responses });
//   } else {
//     return res.status(404).json({ response: 'Session not found' });
//   }
// });



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