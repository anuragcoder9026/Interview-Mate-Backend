import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const apiKey = process.env.API_KEY;

if (!apiKey) {
    throw new Error('API_KEY is not defined in environment variables.');
}

const genAI = new GoogleGenerativeAI(apiKey);
const INITIAL_PROMPT = "You are the interviewer in an interview. Ask me questions one by one. And don't stick to one topic. Try to generate different questions to make it feel like a real interview, covering all aspects in 10 to 15 questions.";

export async function generate_response(query, conversation_history, initial_prompt = INITIAL_PROMPT) {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const current_conversation = conversation_history.slice(-10).concat([`user: ${query}`]).join('\n');
    const full_prompt = `${initial_prompt}\n${current_conversation}`;
    
    try {
        const result = await model.generateContent(full_prompt);

        if (result?.response?.candidates?.length > 0) {
            const textContent = result.response.candidates[0]?.content?.parts[0]?.text;
            if (textContent) {
                conversation_history.push(`ai: ${textContent}`);
                return textContent;
            }
        }

        console.error('Invalid API response:', result);
        return 'Sorry, I couldn\'t generate a response.';
    } catch (error) {
        console.error('Error generating response:', error);
        return 'An error occurred while generating the response.';
    }
}

export async function evaluate_answer(question, answer) {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Question: ${question}\nAnswer: ${answer}\nEvaluate the above answer as an interview response. Provide a rating (Excellent, Good, Average, Poor) and explain why.`;

    try {
        const result = await model.generateContent(prompt);

        if (result?.response?.candidates?.length > 0) {
            const evaluation_text = result.response.candidates[0]?.content?.parts[0]?.text;
            let rating = "Average";
            if (evaluation_text.includes("Excellent")) rating = "Excellent";
            else if (evaluation_text.includes("Good")) rating = "Good";
            else if (evaluation_text.includes("Poor")) rating = "Poor";

            return { rating, evaluation_text };
        }

        console.error('Invalid API response:', result);
        return { rating: "Average", evaluation_text: 'Unable to evaluate.' };
    } catch (error) {
        console.error('Error evaluating answer:', error);
        return { rating: "Average", evaluation_text: 'An error occurred while evaluating the answer.' };
    }
}
