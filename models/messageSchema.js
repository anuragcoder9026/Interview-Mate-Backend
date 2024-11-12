import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { 
    text:{type: String}, 
    image:{type: String}
  },
  status: { type: String, enum: ['sent', 'received', 'seen'], default: 'sent' },
  timestamp: { type: Date, default: Date.now },
  time:{type:String},
});


const Message = new mongoose.model("Message", messageSchema);
export {Message};