import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const callGemini = async (prompt) => {
  if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is missing");
    return "Error: GEMINI_API_KEY not configured";
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return text || "No response from Gemini";
  } catch (error) {
    console.error("Gemini SDK error:", error.message || error);
    return "Error calling Gemini";
  }
};