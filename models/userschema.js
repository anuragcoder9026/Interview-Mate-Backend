import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
    name:  { type: String, required: true, unique: false },
    username : { type: String, required: true, unique: true },
    email:  { type: String, required: true, unique: true },
    password: { type: String, default:null},
    branch: { type: String, required: false, unique: false },
    year: { type: Number, required: false, unique: false },
    college: { type: String, required: false, unique: false },
    profileimg : { type: String,default:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRT0M9PkaDKnCMW8NANGmmvjkS-WhhsIOe4pQ&s", required: false, unique: false },
},{timestamps:true});


userSchema.pre("save",async function (next){
    if(!this.isModified("password")) return next;
  this.password=await bcrypt.hash(this.password,10)// 10:number of round in hashing
  next();
  })
  
  userSchema.methods.isPasswordCorrect=async function(password){
  return await bcrypt.compare(password,this.password) ; 
  }
  
  userSchema.methods.generateAccessToken=function(){
    return jwt.sign(
    {
      _id:this._id,
      email:this.email,
      username:this.username,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn:process.env.ACCESS_TOKEN_expiry *24*60*60*1000
    }
    )
  }
//saving schema to database
const User = new mongoose.model("users", userSchema);

//exporting db
export {User};



