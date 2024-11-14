// routes/interviewRoutes.js
import express from 'express';
import isAuthenticated from "../middleware/checkAuth.js"
import { handleGeminiPost,getResult,getAllResults ,getUserInterviewCount} from '../controller/interviewController.js';

const router = express.Router();

// Post route for Gemini
router.post('/gemini', isAuthenticated, handleGeminiPost);

// Get route for interview results
router.get('/result',  isAuthenticated,getResult);
router.get('/all-results',  isAuthenticated,getAllResults);
router.get('/interview-count',isAuthenticated, getUserInterviewCount);

export default router;
