import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is missing! Please check your .env file.");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateTasks = async ({ projectTitle, description, techStack }) => {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash"
  });

  const prompt = `
Return ONLY valid JSON.

No explanation.
No markdown.
No extra text.

Format:
[
  { "title": "Task name", "type": "frontend|backend|devops|design|other" }
]

Project Title: ${projectTitle}
Description: ${description}
Tech Stack: ${techStack?.join(", ")}
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error(error);
    return [
      { title: "Setup project structure", type: "other" },
      { title: "Initialize backend", type: "backend" },
      { title: "Setup frontend", type: "frontend" }
    ];
  }
};

export { generateTasks };