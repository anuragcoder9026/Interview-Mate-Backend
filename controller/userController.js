import { User } from "../models/userschema.js"
import jwt from "jsonwebtoken"

//SignUp the user
const SignUp=async(req,res)=>{
    const { name,username,email,password,branch,year,college}=req.body;
    if([email,username,password].some((field)=>field?.trim() === "")){
        res.status(400).json({"message":"All fields are required"});
    }
    else{
        let existedUser=await User.findOne({username})
        if(existedUser){
            return res.status(400).json({"message":"Username already exist."});
        }
        existedUser=await User.findOne({email})
        if(existedUser){
            return res.status(400).json({"message":"Email already exist."});
        }
        else{
        let user=await User.create({name,username,email,password,branch,year,college});    
        let createdUser=await User.findById(user._id).select("-password");
        if(!createdUser){
        res.status(400).send({"message":"Something went wrong while regestering the user"});
        }
        else{
         const accessToken=createdUser.generateAccessToken();
         console.log(accessToken);
         
         const options = {
            expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours in milliseconds
            httpOnly: true,
            path: '/',
            secure: true,
            sameSite: 'None'
          };
          
         return res.status(200)
        .cookie("accessToken",accessToken,options)
        .json({"content":createdUser,"message":"User signup sucessfully"})}
        }
    }

}

//Login the User
const LogIn=async (req,res)=>{
    const {email,password}=req.body;
    
    if([email,password].some((field)=>field?.trim() === "")){
        res.status(400).json({"message":"All fields are required "});
    }
    else{
        let existedUser=await User.findOne({email});
    if(!existedUser){
        return res.status(400).json({message:"Email does not match"})
    }
    else{
        let check=false;
        if(existedUser.password){check=await existedUser.isPasswordCorrect(password);}
        if(!check){
            return res.status(400).send({message:"Password does not match"})
        }
        else{
            const accessToken=existedUser.generateAccessToken();
            const options = {
               maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
               httpOnly: true,
               path: '/',
               secure: true,
               sameSite: 'None'
             };      
           
           res.cookie("accessToken",accessToken,options)  ;
           res.status(200).json({"message":"User Login sucessfully"});
        }
    }
}

}

const LogOut = async (req, res) => {
    // Clear all cookies
    Object.keys(req.cookies).forEach((cookieName) => {
        res.clearCookie(cookieName, {
            path: '/',
            secure: true,
            sameSite: 'None'
        });
    });

    res.status(200).send('User logged out successfully');
};


export {LogOut,SignUp,LogIn}