import { Schema, model } from 'mongoose';

const CommentSchema=new Schema({
 content:{type:String,default:''},
 commentUser:{ type: Schema.Types.ObjectId, ref: 'User' },
 post:{type: Schema.Types.ObjectId, ref: 'Post' },
 date: { type: Date, default: Date.now },
});

const Comment=model('Comment',CommentSchema);

export {Comment}