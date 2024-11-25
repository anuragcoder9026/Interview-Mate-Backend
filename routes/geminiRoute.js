// routes/interviewRoutes.js
import express from 'express';
import isAuthenticated from "../middleware/checkAuth.js"
import { handleGeminiPost,getResult,getAllResults ,getUserInterviewCount,savescore,getquizCount, getAllQuizResults} from '../controller/interviewController.js';

const router = express.Router();

// Post route for Gemini
router.post('/gemini', isAuthenticated, handleGeminiPost);

// Get route for interview results
router.get('/result',  isAuthenticated,getResult);
router.get('/all-results',  isAuthenticated,getAllResults);
router.get('/all-quiz',  isAuthenticated,getAllQuizResults);
router.get('/quiz-count',  isAuthenticated,getquizCount);
router.get('/interview-count',isAuthenticated, getUserInterviewCount);
router.post('/saveresult',isAuthenticated, savescore);

export default router;
