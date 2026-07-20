const { GoogleGenAI } = require("@google/genai");

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

let ai = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
} else {
  console.warn("GEMINI_API_KEY is not configured in environment variables.");
}

module.exports = { ai };
