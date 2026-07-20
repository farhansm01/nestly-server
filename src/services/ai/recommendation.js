const { ai } = require("../../lib/gemini");
const Property = require("../../models/Property");

/**
 * Service to rank properties based on user preferences using Gemini AI & Luxury Multi-Attribute Scoring
 */
const getAIRecommendations = async (userPreferences) => {
  const { budget, location, propertyType, bedrooms, lifestyle = [] } = userPreferences;

  // 1. Fetch active properties from DB
  const properties = await Property.find({
    status: { $nin: ["Pending", "pending", "Rejected", "rejected"] },
  }).limit(30);

  if (!properties || properties.length === 0) {
    return [];
  }

  // Generate tailored AI match reason based on property traits
  const generateMatchReason = (p, score) => {
    const type = (p.type || "home").toLowerCase();
    const loc = p.location || "California";
    const priceStr = typeof p.price === "number" ? `$${p.price.toLocaleString()}` : p.price;

    if (type.includes("penthouse")) {
      return `Top ${score}% AI Match: Panoramic skyline views, floor-to-ceiling glass, and private elevator access in ${loc}.`;
    }
    if (type.includes("villa") || type.includes("estate")) {
      return `Top ${score}% AI Match: Luxury oceanfront estate featuring infinity pool, gated security, and sprawling grounds.`;
    }
    if (type.includes("apartment") || type.includes("flat")) {
      return `Top ${score}% AI Match: Modern metropolitan residence with smart automation, 24/7 security, and strong yield potential.`;
    }
    if (type.includes("suburban") || type.includes("house")) {
      return `Top ${score}% AI Match: Smart eco-friendly residence with solar panels, quiet surroundings, and top school district.`;
    }

    return `Top ${score}% AI Match: Matches your target criteria in ${loc} with exceptional value at ${priceStr}.`;
  };

  // Helper for multi-attribute scoring
  const calculateScore = (p, idx) => {
    let score = 95 - idx;
    if (propertyType && propertyType !== "all" && p.type === propertyType.toLowerCase()) score += 3;
    if (location && p.location?.toLowerCase().includes(location.toLowerCase())) score += 2;
    if (bedrooms && p.beds >= Number(bedrooms)) score += 1;
    if (budget && typeof p.price === "number" && p.price <= Number(budget)) score += 1;
    return Math.min(Math.max(score, 88), 99);
  };

  // Try Gemini AI Model Call
  if (ai) {
    try {
      const prompt = `
You are Nestly AI's Luxury Real Estate Match Engine.
User Preferences:
- Target Budget: $${budget || "Any"}
- Location: ${location || "Any"}
- Property Type: ${propertyType || "Any"}
- Bedrooms: ${bedrooms || "Any"}
- Desired Lifestyle Amenities: ${Array.isArray(lifestyle) ? lifestyle.join(", ") : "Luxury, Security, Smart Home"}

Available Properties JSON:
${JSON.stringify(
  properties.map((p) => ({
    id: p._id.toString(),
    title: p.title,
    type: p.type,
    price: p.price,
    location: p.location,
    beds: p.beds,
    sqft: p.sqft,
  }))
)}

Select and rank the top 6 properties that offer the highest luxury compatibility.
Return ONLY a valid JSON array of objects:
[
  { "id": "property_id_string", "matchScore": 98, "reason": "Short 1-sentence tailored AI match explanation" }
]
`;

      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents: prompt,
      });

      if (response && response.text) {
        const responseText = response.text;
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const rankedItems = JSON.parse(jsonMatch[0]);
          const rankedIds = rankedItems.map((item) => item.id);

          const matchedProperties = properties.filter((p) => rankedIds.includes(p._id.toString()));
          return matchedProperties.map((p, idx) => {
            const item = rankedItems.find((r) => r.id === p._id.toString());
            const score = item ? item.matchScore : calculateScore(p, idx);
            return {
              ...p.toObject(),
              matchScore: score,
              matchReason: item ? item.reason : generateMatchReason(p, score),
            };
          });
        }
      }
    } catch (error) {
      console.warn("Gemini AI API notice (using luxury scoring engine):", error.message);
    }
  }

  // Multi-Attribute Dynamic Fallback Engine
  const ranked = properties
    .map((p, idx) => {
      const score = calculateScore(p, idx);
      return {
        ...p.toObject(),
        matchScore: score,
        matchReason: generateMatchReason(p, score),
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);

  return ranked.slice(0, 6);
};

module.exports = { getAIRecommendations };
