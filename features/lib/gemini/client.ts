import { GoogleGenAI } from "@google/genai";
import { env } from "@/config/env";

export const geminiClient = new GoogleGenAI({
  apiKey: env.GOOGLE_AI_API_KEY,
});
