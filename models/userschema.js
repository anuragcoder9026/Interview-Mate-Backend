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
    posts:[{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
    savedPosts:[{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments:[{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
    notifications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Notification',unique:true}],
    readNotifications:[{ type: mongoose.Schema.Types.ObjectId, ref: 'Notification',unique:true}],
    views: { type: Number, default: 0 },
    online: { type: Boolean, default: false },
    chats:[{ type: mongoose.Schema.Types.ObjectId, ref: 'Chat' }],
    profileimg : { type: String,default:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRT0M9PkaDKnCMW8NANGmmvjkS-WhhsIOe4pQ&s", required: false, unique: false },
    coverImage:{type: String,default:"https://images.unsplash.com/photo-1568605114967-8130f3a36994", required: false, unique: false},
    about:{ type: String,},
    intro: {
      city: { type: String,},
      country: { type: String,},
      current_position: { type: String,},
      education: { type: String,},
      headline: { type: String, },
      industry: { type: String,},
      name: { type: String,},
      pronouns: { type: String,},
      tagline: { type: String,}
  },
  educations:[{
    course: { type: String},
    field:  { type: String},
    image:  { type: String,default:"https://feualabang.edu.ph/assets/features/34/Pt6wH.png",},
    institute: { type: String},
    start_year: { type: Number},
    end_year: { type: Number},
    grade: { type: String},
  },],
  experiences:[{
    title: { type: String},
    emp_type: { type: String},
    image:{ type: String,default:"https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSa4Vy2MHI6zbHxDmZiHG17HVgyBCRfZYvM5Q&s"},
    company: { type: String},
    start_month:{ type: String},
    start_year: { type: Number},
    end_month:{ type: String},
    end_year: { type: Number},
    location:{ type: String},
    loc_type:{ type: String},
    description:{ type: String},
    readmore:{type:Boolean}
}],
skills:[{type: String}],
sessions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Session' }]  ,// Link to Session model
quizzes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' }]  // Link to the Quiz model
},
{timestamps:true});


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
const User = new mongoose.model("User", userSchema);

//exporting db
export {User};



