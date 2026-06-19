import { Groq } from 'groq-sdk';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const groq = new Groq({ 
  apiKey: process.env.GROQ_API_KEY // Store your key in the .env file
});
