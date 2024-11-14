import { Schema, model } from 'mongoose';

const EventChatSchema=new Schema({
 text:{type:String},    
 image:{type:String},
 name:{type:String},
 username : {type:String},
 time: { type: Date,required: true },
 
});

const EventChat=model('EventChat',EventChatSchema);

export {EventChat}