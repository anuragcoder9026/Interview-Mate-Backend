import {
  generate_response,
  evaluate_answer,
} from "../services/googleAIService.js";
import { Session } from "../models/session.js";
import { User } from "../models/userschema.js";
import { Quiz } from "../models/quizSchema.js";

// const sessionData = {};
// const interview_results = {};

// export const handleGeminiPost = async (req, res) => {
//   const user = req.user?._id;
//   const { company, role, formId } = req.body; // Assuming company and role are sent in the request body

//   const session_id = `${role}-${company}-${formId}`; // Create a unique session ID

//   if (!sessionData[session_id]) {
//     sessionData[session_id] = {
//       qsns: 0,
//       conversation_history: [],
//       responses: [],
//       generated_questions: [],
//       flag: 0,
//       prev_ques: "",
//       total_score: 0,
//     };
//   }

//   const {
//     qsns,
//     conversation_history,
//     responses,
//     generated_questions,
//     flag,
//     prev_ques,
//     score,
//   } = sessionData[session_id];
//   const user_message = req.body.message;

//   if (!user_message) {
//     return res.json({ response: "Kindly say hi to start" });
//   }

//   try {
//     // Generate a response question
//     let current_question = await generate_response(
//       user_message,
//       conversation_history
//     );
//     generated_questions.push(current_question);

//     if (flag !== 0) {
//       conversation_history.push(`user: ${user_message}`);

//       // Evaluate the answer
//       const { rating, evaluation_text } = await evaluate_answer(
//         prev_ques,
//         user_message
//       );

//       // Create the response entry
//       const response_entry = {
//         question: prev_ques,
//         answer: user_message,
//         rating: rating,
//         evaluation: evaluation_text,
//       };
//       console.log(rating);

//       // Update total score based on rating
//       sessionData[session_id].total_score +=
//         rating === "Poor"
//           ? 30
//           : rating === "Good"
//           ? 60
//           : rating === "average"
//           ? 50
//           : 90;

//       // Calculate the average and add 70 points
//       sessionData[session_id].total_score =
//         sessionData[session_id].total_score / sessionData[session_id].qsns;

//       responses.push(response_entry);
//       console.log(response_entry);
//       console.log(sessionData[session_id].total_score);

//       // Save the response to MongoDB
//       const userExists = await User.findById(user);
//       if (userExists) {
//         let session = await Session.findOne({ session_id });

//         if (session) {
//           // Add response to existing session
//           session.score = sessionData[session_id].total_score;
//           session.responses.push(response_entry);
//           session.end_time = Date.now();
//           await session.save();
//           console.log("Response added to existing session.");
//         } else {
//           // Create a new session if none exists
//           session = new Session({
//             session_id,
//             user: userExists._id,
//             comapany: company,
//             role: role,
//             score: sessionData[session_id].total_score,
//             responses: [response_entry],
//             start_time: Date.now(),
//             end_time: Date.now(),
//           });

//           await session.save();

//           // Link the session to the user's sessions array
//           userExists.sessions.push(session._id);
//           await userExists.save();
//           console.log("New session created and linked to user.");
//         }
//       } else {
//         console.log("User not found.");
//         return res.status(404).json({ response: "User not found" });
//       }
//     }

//     // Update sessionData and response
//     sessionData[session_id].qsns++;
//     sessionData[session_id].prev_ques = current_question;
//     sessionData[session_id].flag = 1;

//     if (sessionData[session_id].qsns >= 6) {
//       // Save the responses to interview_results for further processing
//       interview_results[session_id] = responses.slice();

//       // Reset sessionData for this session_id
//       sessionData[session_id] = {
//         qsns: 0,
//         conversation_history: [],
//         responses: [],
//         generated_questions: [],
//         flag: 0,
//         prev_ques: "",
//       };

//       // Redirect to the results page
//       const redirect_url =
//         "https://alokthakur490.github.io/Interview-Mate-frontend/result/";
//       return res.json({
//         response: current_question,
//         redirect: redirect_url,
//       });
//     }

//     return res.json({ response: current_question, session_id });
//   } catch (error) {
//     console.error("Error processing request:", error);
//     return res.status(500).json({ response: `Error: ${error.message}` });
//   }
// };

export const handleGeminiPost = async (req, res) => {
  const user = req.user?._id;
  const { company, role, formId, message: user_message } = req.body;

  // Validate required fields
  if (!user || !company || !role || !formId) {
    return res.status(400).json({ response: "Missing required data." });
  }

  if (!user_message) {
    return res.json({ response: "Kindly say hi to start." });
  }

  const session_id = `${role}-${company}-${formId}`; // Unique session identifier

  try {
    // Fetch or create session
    let session = await Session.findOne({ session_id }).populate("user");
    if (!session) {
      const userExists = await User.findById(user);
      if (!userExists) {
        return res.status(404).json({ response: "User not found." });
      }

      session = new Session({
        session_id,
        user: userExists._id,
        company,
        role,
        score: 0,
        responses: [],
        history: [],
      });

      await session.save();
      userExists.sessions.push(session._id);
      await userExists.save();
    }

    // Log the user's message to history
    session.history.push({
      event: "User message",
      data: { message: user_message },
    });
    await session.save(); // Save the session after updating history

    const formatText = (text) => {
      return text
        .replace(/\*(.*?)\*/g, '') // Bold for headings
        .replace(/_(.*?)_/g, '') // Italics for subheadings
        .replace(/•/g, '') // Bullet points
        .replace(/\n/g, ''); // Line breaks
    };
   
 

    // Check if it's the first message
    let current_question = "";
    if (session.history.length === 1) {
      // Generate the first question based on the user's initial message
      current_question = await generate_response(user_message, []);
      current_question = formatText(current_question);
    } else {
      // Generate the next question based on the session's history
      const conversation_history = session.history
        .map((entry) => {
          const question = entry.data?.question || "";
          const answer = entry.data?.message || "";
         // const evaluation = entry.data?.evaluation || "No evaluation";

          return `${question} ${answer} `;
        });

      // Check if the conversation history is empty
      if (conversation_history.length === 0) {
        return res.status(400).json({ response: "No history available to generate question." });
      }

      try {
        // Generate the next question based on the entire session's history
        current_question = await generate_response(user_message, conversation_history);
        current_question = formatText(current_question);
        await session.save(); // Save after generating the new question
      } catch (error) {
        console.error("Error generating question:", error);
        return res.status(500).json({ response: `Error generating question: ${error.message}` });
      }
    }

    if (!current_question) {
      return res.status(500).json({ response: "Failed to generate a valid question." });
    }

    // Log the generated question to history
    session.history.push({
      event: "Question generated",
      data: { question: current_question },
    });
    await session.save(); // Save the session after generating the question

    // Only evaluate the response if there's a previous question in the history
    if (session.history.length > 2) {
      const prev_history_entry = session.history[session.history.length - 3];
      const prev_ques = prev_history_entry.data?.question;
      const user_history_entry = session.history[session.history.length - 2];
      const user_ans = user_history_entry.data?.message;

      // Ensure that the previous question is available for evaluation
      if (!prev_ques) {
        console.error("Previous question is missing; cannot evaluate response.");
        return res.status(400).json({ response: "Previous question is missing." });
      }

      // Evaluate the user's response to the previous question
      let { rating, evaluation_text } = await evaluate_answer(prev_ques, user_ans);
      evaluation_text = formatText(evaluation_text);

      // Ensure that the response includes the required fields
      const response_entry = {
        question: prev_ques,
        answer: user_ans,
        rating,
        evaluation: evaluation_text,
      };
      session.responses.push(response_entry);
      await session.save(); // Save the session after adding the response

      // Update the session's score based on the rating
      
       if(rating === "Poor")
          session.score+= 20
          else if( rating === "Good")
          session.score+= 30
          else if(rating === "Average")
          session.score+=50
          

          session.score = Math.round((session.score / session.history.length) * 2.5);


      // // Log evaluation details to history
      // session.history.push({
      //   event: "Answer evaluated",
      //   data: { question: prev_ques, answer: user_ans, rating, evaluation: evaluation_text },
      // });
      await session.save(); // Save the session after logging evaluation details
    } else {
      console.log("No previous question to evaluate.");
    }

    // Update session's end time and save
    session.end_time = Date.now();
    await session.save(); // Save at the end

    // Check if the session has completed the required number of responses
    if (session.responses.length >= 6) {
      // Session is completed, save the final score
      session.history.push({
        event: "Session completed",
        data: { final_score: session.score },
      });
      await session.save();

      // Redirect to the results page
      const redirect_url =
        "https://alokthakur490.github.io/Interview-Mate-frontend/result/";
      return res.json({
        response: current_question,
        redirect: redirect_url,
      });
    }

    // Return the current question and session_id
    return res.json({ response: current_question, session_id });
  } catch (error) {
    console.error("Error processing request:", error);
    return res.status(500).json({ response: `Error: ${error.message}` });
  }
};


// Fetch the results based on session_id
export const getResult = async (req, res) => {
  const userId = req.user?._id; // Get the current user ID
  const sessionId = req.sessionID; // Get the session ID

  try {
    // Find the session for the current user and session ID
    const session = await Session.findOne({
      session_id: sessionId,
      user: userId,
    }).populate("user");

    if (session) {
      // If session found, return the responses
      return res.json({ responses: session.responses });
    } else {
      // Session not found for this user and session ID
      return res
        .status(404)
        .json({ response: "Session not found for the current user" });
    }
  } catch (error) {
    console.error("Error fetching session responses:", error);
    return res.status(500).json({ response: "Internal server error" });
  }
};

export const getAllResults = async (req, res) => {
  const userId = req.user?._id; // Get the current user's ID from the request
  console.log(userId);

  if (!userId) {
    return res.status(400).json({ response: "User not authenticated" });
  }

  try {
    // Get sessions only for the current user with their responses
    const results = await User.aggregate([
      {
        $match: { _id: userId }, // Match the user ID
      },
      {
        $lookup: {
          from: "sessions",
          localField: "_id",
          foreignField: "user",
          as: "sessions",
        },
      },
      {
        $project: {
          _id: 1,
          username: 1, // Include username or any other fields you want
          sessions: {
            session_id: 1,
            responses: 1,
            start_time: 1,
            end_time: 1,
            role: 1,
            comapany: 1,
            score: 1,
            company: 1,
          },
        },
      },
    ]);

    if (results && results.length > 0) {
      return res.json({ users: results });
    } else {
      return res
        .status(404)
        .json({ response: "No results found for the current user" });
    }
  } catch (error) {
    console.error(
      "Error fetching session responses for the current user:",
      error
    );
    return res.status(500).json({ response: "Internal server error" });
  }
};

export const getUserInterviewCount = async (req, res) => {
  const userId = req.user?._id; // Assuming the user ID is available in the request
  console.log("hii alok");

  if (!userId) {
    return res.status(400).json({ response: "User not authenticated" });
  }

  try {
    // Count the number of sessions for this user
    const interviewCount = await Session.countDocuments({ user: userId });

    // Return the count to the user
    console.log(interviewCount);
    return res.json({ interviewCount });
  } catch (error) {
    console.error("Error fetching interview count for user:", error);
    return res.status(500).json({ response: "Internal server error" });
  }
};

export const getquizCount = async (req, res) => {
  const userId = req.user?._id; // Assuming the user ID is available in the request
  console.log("hii alok");

  if (!userId) {
    return res.status(400).json({ response: "User not authenticated" });
  }

  try {
    // Count the number of sessions for this user
    const quizCount = await Quiz.countDocuments({ user_id: userId });

    // Return the count to the user
    console.log(quizCount);
    return res.json({ quizCount });
  } catch (error) {
    console.error("Error fetching interview count for user:", error);
    return res.status(500).json({ response: "Internal server error" });
  }
};

export const savescore = async (req, res) => {
  const userId = req.user?._id; // Get user ID from the request (auth middleware)
  const { topic, score, total } = req.body; // Get quiz data from the request body
  console.log("hello");

  try {
    // Check if the user exists
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const adjustedScore = score / 10;
    const adjustedTotal = total / 10;
    // Create a new quiz result
    const newQuizResult = new Quiz({
      user_id: userId, // Store the user_id
      topic: topic,
      correct: adjustedScore,
      total: adjustedTotal,
    });

    // Save the quiz result to the database
    const savedResult = await newQuizResult.save();
    console.log("Quiz saved successfully:", savedResult);

    // Add the new quiz result to the user's quizzes array
    user.quizzes.push(savedResult._id);
    await user.save();

    // Respond with the saved quiz result and success message
    return res.status(201).json({
      message: "Quiz result saved successfully",
      quiz: savedResult,
    });
  } catch (error) {
    console.error("Error saving quiz result:", error);
    return res.status(500).json({ message: "Error saving quiz result", error });
  }
};

//quiz
export const getAllQuizResults = async (req, res) => {
  const userId = req.user?._id; // Get the current user's ID from the request
  console.log(userId);

  if (!userId) {
    return res.status(400).json({ response: "User not authenticated" });
  }

  try {
    // Get quizzes only for the current user with their results
    const results = await User.aggregate([
      {
        $match: { _id: userId }, // Match the user ID
      },
      {
        $lookup: {
          from: "quizzes", // Reference the Quiz collection
          localField: "_id", // Match the user's _id field
          foreignField: "user_id", // Reference the user_id field in Quiz collection
          as: "quizzes", // Store the resulting quizzes in the "quizzes" field
        },
      },
      {
        $project: {
          _id: 1,
          username: 1, // Include username or any other fields you want
          quizzes: {
            _id: 1, // Include quiz fields you need
            topic: 1,
            correct: 1,
            total: 1,
            date: 1, // You can add other fields like timestamp
          },
        },
      },
    ]);

    if (results && results.length > 0) {
      return res.json({ users: results });
    } else {
      return res
        .status(404)
        .json({ response: "No quiz results found for the current user" });
    }
  } catch (error) {
    console.error("Error fetching quiz results for the current user:", error);
    return res.status(500).json({ response: "Internal server error" });
  }
};
