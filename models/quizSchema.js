import mongoose from 'mongoose';

// Define the QuizSchema with a reference to the User model
const quizSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',  // Reference to the User model
      required: true,  // Ensure a user is always associated with the quiz
    },
    topic: {
      type: String,
      required: true,  // Topic must be provided
    },
    correct: {
      type: Number,
      required: true,  // Correct answers must be provided
    },
    total: {
      type: Number,
      required: true,  // Total number of questions
    },
    date: {
      type: Date,
      default: Date.now,  // Set the date to the current date and time
    },
  },
  { timestamps: true }  // Automatically adds createdAt and updatedAt fields
);

// Create the model from the schema
const Quiz = mongoose.model('Quiz', quizSchema);

export { Quiz };
