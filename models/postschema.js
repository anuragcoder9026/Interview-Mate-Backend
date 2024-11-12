import { Schema, model } from 'mongoose';

const PostSchema=new Schema({
 title:{type:String},    
 content:{type:String},
 postUser:{ type: Schema.Types.ObjectId, ref: 'User' },
 likes:[{ type: Schema.Types.ObjectId, ref: 'User' }],
 comments:[{ type: Schema.Types.ObjectId, ref: 'Comment' }],
 postImage:{type:String,default:null}, 
 date: { type: Date, default: Date.now },
 impression: { type: Number, default: 0 }
});

const Post=model('Post',PostSchema);

export {Post}