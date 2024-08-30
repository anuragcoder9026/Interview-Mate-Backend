require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
require("./db/cone")
const session  = require('express-session');
const passport = require("passport");
const GoogleStrategy = require('passport-google-oauth2').Strategy;
const userdb = require("./models/userschema")
const port = 3200;

const clientid = process.env.CLIENT_ID;
const clientsecret = process.env.CLIENT_SEC;


//middleware

app.use(cors({
    origin: "http://localhost:5173",
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
}));

app.use(express.json());

app.use(session({
    secret: process.env.SEC,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());


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

app.listen(port,(error)=>{
 if(!error){
    console.log("🎉Successfully conntected to server ");
 }
 else console.log("Error connecting" ,error);
});