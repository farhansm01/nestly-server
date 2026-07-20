const { ai } = require("../../lib/gemini");

/**
 * Service for real estate conversational assistant using Gemini AI
 */
const getAIChatResponse = async ({ message, history = [], propertyContext = null }) => {
  if (!message || message.trim().length === 0) {
    throw new Error("Message text is empty.");
  }

  if (!ai) {
    return "Hello! I am Nestly's AI Real Estate Assistant. Configure GEMINI_API_KEY to activate interactive AI responses.";
  }

  try {
    let systemInstruction = `You are Nestly AI, an friendly, expert real estate assistant guiding home buyers, renters, and property sellers. Be helpful, concise, and informative.`;

    if (propertyContext) {
      systemInstruction += `\nCurrently, the user is viewing property listing:
Title: ${propertyContext.title || "N/A"}
Price: ${propertyContext.formattedPrice || propertyContext.price || "N/A"}
Location: ${propertyContext.location || "N/A"}
Type: ${propertyContext.type || "N/A"}
Bedrooms: ${propertyContext.beds || "N/A"}, Bathrooms: ${propertyContext.baths || "N/A"}
Description: ${propertyContext.shortDesc || propertyContext.fullDesc || "N/A"}`;
    }

    const contents = [
      { role: "user", parts: [{ text: systemInstruction }] },
      ...history.map((h) => ({
        role: h.role === "assistant" || h.role === "model" ? "model" : "user",
        parts: [{ text: h.content || h.text || "" }],
      })),
      { role: "user", parts: [{ text: message }] },
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
    });

    return response.text;
  } catch (error) {
    console.error("Gemini AI chat error:", error);
    throw new Error(`AI Assistant error: ${error.message}`);
  }
};

module.exports = { getAIChatResponse };
