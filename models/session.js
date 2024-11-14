import mongoose from 'mongoose';

// Define the Response schema
const responseSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true
    },
    answer: {
        type: String,
        required: true
    },
    rating: {
        type: String,
        enum: ['Excellent', 'Good', 'Average', 'Poor'],
        required: true
    },
    evaluation: {
        type: String,
        required: true
    }
});

// Define the Session schema
const sessionSchema = new mongoose.Schema({
    session_id: {
        type: String,
        required: true,
        unique: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    comapany: {
        type: String,
        required: true,
        unique: false
    },
    role: {
        type: String,
        required: true,
        unique: false
    },

    score:{
      type :Number,
      required :true,
      unique :false
    }
    ,
    responses: [responseSchema],  // Array of responses for this session
    start_time: {
        type: Date,
        default: Date.now
    },
    end_time: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Create the model for Session
const Session = mongoose.model('Session', sessionSchema);

export { Session };
