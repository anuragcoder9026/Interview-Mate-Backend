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
import messageRouter from "./routes/messageRouter.js";
import eventRouter from "./routes/eventRouter.js"
import geminiRoute from './routes/geminiRoute.js';
import http from "http";
import {Server} from "socket.io";
import { Message } from './models/messageSchema.js';
import { Chat } from './models/chatSchema.js';
import { sendMessage } from './controller/messageController.js';
const app = express();
const port =  process.env.PORT || 3200; ;
const HOST = '0.0.0.0';


const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173', 
  },
});




io.on('connection', (socket) => {
 
  // Join user to room based on user ID
  socket.on('join', async (userId) => {
    socket.userId = userId;
    socket.join(userId);
    await User.findByIdAndUpdate(userId, { online: true });
    io.emit('userOnlineStatus', { userId, online: true });
  });

  // Handle typing status
  socket.on('typing', (data) => {
    io.to(data.recipientId).emit('userTyping', { userId: data.userId, typing: data.typing });
  });

  // Handle sending messages
  socket.on('sendMessage', async ({ senderId, recipientId, content,time }) => {
    const message = await sendMessage(senderId, recipientId, content,time);
    const unseenCount = await Message.countDocuments({
      sender: senderId,
      receiver: recipientId,
      status: { $ne:'seen'}
  });
  
    io.to(recipientId).emit('receiveMessage', {userId:senderId,message,unseenCount});
    io.to(senderId).emit('receiveMessage', {userId:recipientId,message,unseenCount});
  
    // Single tick to sender (message sent)
    io.to(senderId).emit('messageStatus', { messageId: message._id, status: 'sent' });
    const TotalUnseenCount = await Message.countDocuments({
      receiver: recipientId,
      status: { $ne:'seen'}
  });
  io.to(recipientId).emit('TotalUnseenCount', {TotalUnseenCount});
  });

  // Mark message as received when recipient receives it
  
  
  socket.on('messageReceived', async (messageId) => {
    const message = await Message.findByIdAndUpdate(messageId, { status: 'received' }, { new: true });
    io.to(message.sender.toString()).emit('messageStatus', { messageId, status: 'received' });
  });

  // Mark message as seen when recipient views it
  socket.on('messageSeen', async (messageId) => {
    const message = await Message.findByIdAndUpdate(messageId, { status: 'seen' }, { new: true });
    io.to(message.sender.toString()).emit('messageStatus', { messageId, status: 'seen' });
  });

  // Handle user disconnection
  socket.on('disconnect', async () => {
    try {
      const disconnectedUser = await User.findByIdAndUpdate(socket.userId, { online: false });
      if (disconnectedUser) {
        io.emit('userOnlineStatus', { userId: disconnectedUser._id, online: false });
      }
      socket.leave(socket.userId);
    } catch (error) {
      console.error('Error updating user status on disconnect:', error);
    }
  });
});



dotenv.config();

app.use(bodyParser.json());
app.use(cors({
  origin: 'https://alokthakur490.github.io',  // Add both URLs
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,  // Allow credentials (cookies)
}));


app.use(express.json());
app.use(session({
  secret:process.env.SEC,
  resave: false,
  saveUninitialized: true,

}));
app.use(passport.initialize());
app.use(passport.session());


app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/users", userRouter);
app.use("/api/posts",postRouter);
app.use("/api/message",messageRouter);
app.use("/api/event",eventRouter);
app.use('/api', geminiRoute);



const oauth2StrategyLogIn = new OAuth2Strategy({
  clientID:process.env.CLIENT_ID_SIGNIN,
  clientSecret: process.env.CLIENT_SECRET_SIGNIN,
  callbackURL: "https://interview-mate-backend.onrender.com/auth/google/signin/callback", // Corrected URL
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
    callbackURL: "https://interview-mate-backend.onrender.com/auth/google/signup/callback", // Corrected URL
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



app.get('/',(req,res) =>{
 res.write("<h1>Hi Bibhuti Ranjan </h1>");
})
httpServer.listen(port,HOST,(error)=>{
 if(!error){
    console.log("🎉Successfully conntected to server ");
 }
 else console.log("Error connecting" ,error);
});
