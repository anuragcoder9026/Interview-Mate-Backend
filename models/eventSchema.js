import { Schema, model } from 'mongoose';

const EventSchema=new Schema({
 title:{type:String},    
 detail:{type:String},
 eventAdmin:{ type: Schema.Types.ObjectId, ref: 'User' },
 interested:[{ type: Schema.Types.ObjectId, ref: 'User' }],
 time: { type: Date,required: true },
 status: { type: String, enum: ['scheduled', 'live', 'ended'], default: 'scheduled' },
});

const Event=model('Event',EventSchema);

export {Event}