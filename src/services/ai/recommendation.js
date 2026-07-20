const { ai } = require("../../lib/gemini");
const Property = require("../../models/Property");

/**
 * Service to rank properties based on user preferences using Gemini AI
 */
const getAIRecommendations = async (userPreferences) => {
  const { budget, location, propertyType, bedrooms } = userPreferences;

  // 1. Fetch active properties from DB
  const properties = await Property.find({ status: "Active" }).limit(30);

  if (!properties || properties.length === 0) {
    return [];
  }

  if (!ai) {
    // Basic fallback matching if GEMINI_API_KEY is not set
    return properties
      .filter((p) => {
        let match = true;
        if (propertyType && p.type !== propertyType.toLowerCase()) match = false;
        if (budget && p.price > Number(budget)) match = false;
        return match;
      })
      .slice(0, 6);
  }

  try {
    const prompt = `
You are an AI Real Estate Recommendation Engine.
User Preferences:
- Target Budget: $${budget || "Any"}
- Desired Location/City: ${location || "Any"}
- Preferred Property Type: ${propertyType || "Any"}
- Minimum Bedrooms: ${bedrooms || "Any"}

Here is a JSON list of available properties:
${JSON.stringify(
  properties.map((p) => ({
    id: p._id.toString(),
    title: p.title,
    type: p.type,
    price: p.price,
    location: p.location,
    city: p.city,
    beds: p.beds,
    shortDesc: p.shortDesc,
  }))
)}

Please select and rank up to 6 properties that best match the user's preferences.
Return ONLY a valid JSON array of objects with the fields:
"id" (property ID string), "matchScore" (number 1-100), and "reason" (short 1-sentence reason why it matches).
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const responseText = response.text;
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const rankedItems = JSON.parse(jsonMatch[0]);
      const rankedIds = rankedItems.map((item) => item.id);

      // Return fully populated property documents in ranked order
      const matchedProperties = properties.filter((p) => rankedIds.includes(p._id.toString()));
      return matchedProperties.map((p) => {
        const item = rankedItems.find((r) => r.id === p._id.toString());
        return {
          ...p.toObject(),
          matchScore: item ? item.matchScore : 85,
          matchReason: item ? item.reason : "Matches your search criteria",
        };
      });
    }

    return properties.slice(0, 6);
  } catch (error) {
    console.error("Gemini recommendation error:", error);
    return properties.slice(0, 6);
  }
};

module.exports = { getAIRecommendations };
