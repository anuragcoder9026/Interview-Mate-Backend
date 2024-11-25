import mongoose from 'mongoose';

// Define the Response schema
const responseSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',  // Assuming you have a User model
        required: true
    },
    session_id: {
        type: String,
        required: true
    },
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
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Create the model based on the schema
const InterviewResponse = mongoose.model('InterviewResponse', responseSchema);

export default InterviewResponse;
