const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta2/models/gemini-2.5-pro/generateContent";
export const callGemini = async (prompt) => {
  try {
    const response = await fetch(
      `${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    return (
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response from Gemini"
    );
  } catch (error) {
    console.error("Gemini error:", error);
    return "Error calling Gemini";
  }
};