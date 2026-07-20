const { ai } = require("../../lib/gemini");
const Property = require("../../models/Property");

/**
 * Service to rank properties based on user preferences using Gemini AI
 */
const getAIRecommendations = async (userPreferences) => {
  const { budget, location, propertyType, bedrooms } = userPreferences;

  // 1. Fetch active properties from DB
  const properties = await Property.find({
    status: { $nin: ["Pending", "pending", "Rejected", "rejected"] },
  }).limit(30);

  if (!properties || properties.length === 0) {
    return [];
  }

  // Fallback scoring logic helper
  const scoreProperty = (p) => {
    let score = 90;
    if (propertyType && p.type === propertyType.toLowerCase()) score += 5;
    if (budget && typeof p.price === "number" && p.price <= Number(budget)) score += 4;
    if (bedrooms && p.beds >= Number(bedrooms)) score += 1;
    return Math.min(score, 99);
  };

  if (ai) {
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
        model: "gemini-2.0-flash",
        contents: prompt,
      });

      if (response && response.text) {
        const responseText = response.text;
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const rankedItems = JSON.parse(jsonMatch[0]);
          const rankedIds = rankedItems.map((item) => item.id);

          const matchedProperties = properties.filter((p) => rankedIds.includes(p._id.toString()));
          return matchedProperties.map((p) => {
            const item = rankedItems.find((r) => r.id === p._id.toString());
            return {
              ...p.toObject(),
              matchScore: item ? item.matchScore : scoreProperty(p),
              matchReason: item ? item.reason : "Matches your target location and property type",
            };
          });
        }
      }
    } catch (error) {
      console.warn("Gemini recommendation notice (using dynamic fallback):", error.message);
    }
  }

  // Dynamic property recommendation fallback
  return properties
    .map((p) => ({
      ...p.toObject(),
      matchScore: scoreProperty(p),
      matchReason: `Matches your ${p.type || "property"} preferences in ${p.location || "California"}`,
    }))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 6);
};

module.exports = { getAIRecommendations };
