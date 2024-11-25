import mongoose from 'mongoose';

// Define the Response schema
const responseSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  answer: {
    type: String,
    required: true,
  },
  rating: {
    type: String,
    enum: ['Excellent', 'Good', 'Average', 'Poor'],
    required: true,
  },
  evaluation: {
    type: String,
    required: true,
  },
});

// Define the History schema
const historySchema = new mongoose.Schema({
  event: {
    type: String, // Description of the event (e.g., "Question generated", "User response")
    required: true,
  },
  data: {
    type: mongoose.Schema.Types.Mixed, // Store any additional details related to the event
  },
  timestamp: {
    type: Date,
    default: Date.now, // Time of the event
  },
});

// Define the Session schema
const sessionSchema = new mongoose.Schema(
  {
    session_id: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    company: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    responses: [responseSchema], // Array of responses for this session
    history: [historySchema], // Array of events capturing session history
    start_time: {
      type: Date,
      default: Date.now,
    },
    end_time: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true } // Automatically adds `createdAt` and `updatedAt`
);

// Create the model for Session with the collection name 'sessions'
const Session = mongoose.model('Session', sessionSchema, 'sessions');

export { Session };
