import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

// Lazy init — don't crash on import if key is missing (allows server to start for non-AI flows)
let genAI;
const getGenAI = () => {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is missing! Please check your .env file.");
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
};

const generateTasks = async ({ projectTitle, description, techStack }) => {
  const model = getGenAI().getGenerativeModel({
    model: "gemini-2.5-flash"
  });

  const prompt = `
Return ONLY valid JSON.

No explanation.
No markdown.
No extra text.

Format:
[
  { "title": "Task name", "type": "frontend|backend|devops|design|document_work|other" }
]

Project Title: ${projectTitle}
Description: ${description}
Tech Stack: ${techStack?.join(", ")}
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();

    // Robust JSON extraction — handle Gemini sometimes wrapping in extra text
    const jsonMatch = cleanText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON array found in Gemini response");

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("AI task generation failed:", error.message);
    return [
      { title: "Setup project structure", type: "other" },
      { title: "Initialize backend", type: "backend" },
      { title: "Setup frontend", type: "frontend" }
    ];
  }
};

export { generateTasks };