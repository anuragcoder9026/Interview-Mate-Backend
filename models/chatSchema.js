import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  users:[{ type: mongoose.Schema.Types.ObjectId, ref: 'User'}],  
  lastMessage:{ type: mongoose.Schema.Types.ObjectId, ref: 'Message'}
},{ timestamps: true });

const Chat = new mongoose.model("Chat", chatSchema);
export {Chat};