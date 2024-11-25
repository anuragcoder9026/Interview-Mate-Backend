import { Schema, model } from 'mongoose';

const EventChatSchema=new Schema({
 text:{type:String},    
 chatUser:{ type: Schema.Types.ObjectId, ref: 'User' },
 event:{ type: Schema.Types.ObjectId, ref: 'Event' },
 time: { type: Date,default: Date.now  },
 isAdminChat:{ type: Boolean, default: false },
 repliedTo:{ type: Schema.Types.ObjectId, ref: 'User' },
});

const EventChat=model('EventChat',EventChatSchema);

export {EventChat}