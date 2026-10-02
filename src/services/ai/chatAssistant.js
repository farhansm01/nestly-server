const { ai } = require("../../lib/gemini");
const Property = require("../../models/Property");

/**
 * Service for real estate conversational assistant using Gemini AI with full platform & MongoDB catalog context
 */
const getAIChatResponse = async ({ message, history = [], propertyContext = null }) => {
  if (!message || message.trim().length === 0) {
    throw new Error("Message text is empty.");
  }

  // 1. Fetch live available active properties from MongoDB (excluding Pending, Rejected, and Sold)
  let properties = [];
  try {
    properties = await Property.find({
      status: { $nin: ["Pending", "pending", "Rejected", "rejected", "Sold", "sold"] },
    }).limit(30);
  } catch (err) {
    properties = [];
  }

  const catalogSummary = properties.length > 0
    ? properties
        .map(
          (p) =>
            `- "${p.title}" | Type: ${p.type || "Home"} | Price: ${
              typeof p.price === "number" ? `$${p.price.toLocaleString()}` : p.price
            } | Location: ${p.location} | Beds: ${p.beds || "N/A"}, Baths: ${p.baths || "N/A"} | ID: ${p._id}`
        )
        .join("\n")
    : "No active listings currently available.";

  // 2. Try Live Google Gemini API call with full Nestly website context
  if (ai) {
    try {
      let systemInstruction = `You are Nestly AI, the official AI Real Estate Assistant for the Nestly platform (a premier real estate buying and listing web app).

Nestly Platform Context:
- Platform Purpose: Buying and selling residential properties (Apartments, Luxury Villas, Skyline Penthouses, Suburban Homes).
- Active Available Listings Catalog Summary:
${catalogSummary}

Answer user questions accurately based on Nestly platform features and catalog data. Be polite, professional, and helpful.`;

      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: `${systemInstruction}\nUser Question: ${message}`,
      });

      if (response && response.text) {
        return response.text;
      }
    } catch (err) {
      console.warn("Gemini Chat AI notice:", err.message);
    }
  }

  return `I am here to assist you with Nestly real estate listings, price insights, and property tour requests. How can I help you find your dream home?`;
};

module.exports = { getAIChatResponse };
