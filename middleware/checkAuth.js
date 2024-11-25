import jwt from 'jsonwebtoken'; 
import {User} from "../models/userschema.js"
const authMiddleware = (req, res, next) => {
    const token = req.cookies.accessToken;

  if (!token) {
    req.user = null; 
    return next(); 
  }
  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,async (err, decodedToken) => {
    if (err) {
      req.user = null; 
      return next(); 
    }
    const user=await User.findById(decodedToken._id);
    req.user = user; 
    next(); 
  });
};


export default authMiddleware;
