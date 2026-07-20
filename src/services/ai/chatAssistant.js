const { ai } = require("../../lib/gemini");
const Property = require("../../models/Property");

/**
 * Service for real estate conversational assistant using Gemini AI with full platform & MongoDB catalog context
 */
const getAIChatResponse = async ({ message, history = [], propertyContext = null }) => {
  if (!message || message.trim().length === 0) {
    throw new Error("Message text is empty.");
  }

  // 1. Fetch live active properties from MongoDB to provide full website catalog context
  let properties = [];
  try {
    properties = await Property.find({
      status: { $nin: ["Pending", "pending", "Rejected", "rejected"] },
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
- Platform Purpose: Buying and selling verified residential properties (Apartments, Luxury Villas, Skyline Penthouses, Suburban Homes).
- Listing Property Flow: Users can list properties for sale under '/dashboard/add'. New listings default to 'Pending' approval by Nestly Admin.
- Exploration: Users can search and filter properties by location, type, price, and bedrooms under Explore ('/items').
- AI Features: Nestly features Smart Recommendations, AI Document/Lease Auditing, and live AI Assistant chat.

Live Nestly Platform Property Catalog (${properties.length} Active Listings in Database):
${catalogSummary}`;

      if (propertyContext) {
        systemInstruction += `\n\nCurrently, the user is actively viewing this specific property listing:
Title: ${propertyContext.title || "N/A"}
Price: ${propertyContext.formattedPrice || propertyContext.price || "N/A"}
Location: ${propertyContext.location || "N/A"}
Type: ${propertyContext.type || "N/A"}
Bedrooms: ${propertyContext.beds || "N/A"}, Bathrooms: ${propertyContext.baths || "N/A"}
Description: ${propertyContext.shortDesc || propertyContext.fullDesc || "N/A"}`;
      }

      systemInstruction += `\n\nInstructions:
- Respond naturally, warmly, and expertly as Nestly's official AI guide.
- Refer to actual Nestly property listings from the live catalog above when users ask about available homes, specific cities, property types, or price ranges.
- Use clear GitHub-style Markdown formatting (bullet points, bold text).`;

      const contents = [
        { role: "user", parts: [{ text: systemInstruction }] },
        ...history.map((h) => ({
          role: h.role === "assistant" || h.role === "model" ? "model" : "user",
          parts: [{ text: h.content || h.text || "" }],
        })),
        { role: "user", parts: [{ text: message }] },
      ];

      const response = await ai.models.generateContent({
        model: "gemini-flash-latest",
        contents,
      });

      if (response && response.text) {
        return response.text;
      }
    } catch (error) {
      console.warn("Gemini AI API notice (using dynamic website NLP engine):", error.message);
    }
  }

  // 3. Dynamic Website NLP Fallback Engine
  const q = message.toLowerCase();

  // Location Queries (San Francisco, Malibu, Beverly Hills, Palo Alto, LA, etc.)
  const matchedLocs = ["san francisco", "malibu", "beverly hills", "palo alto", "los angeles", "california", "miami", "bay"].filter(
    (loc) => q.includes(loc)
  );

  if (matchedLocs.length > 0) {
    const targetLoc = matchedLocs[0];
    const matchingProps = properties.filter((p) =>
      p.location?.toLowerCase().includes(targetLoc)
    );

    if (matchingProps.length > 0) {
      const propList = matchingProps
        .slice(0, 4)
        .map(
          (p) =>
            `• **${p.title}** (${p.type || "Home"}) — ${
              typeof p.price === "number" ? `$${p.price.toLocaleString()}` : p.price
            } in *${p.location}*`
        )
        .join("\n");
      return `Nestly currently features **${matchingProps.length} active property listing(s)** in **${targetLoc.toUpperCase()}**:\n\n${propList}\n\nYou can explore full photos and floorplans on the **Explore Properties** page!`;
    }
    return `In **${targetLoc.toUpperCase()}**, real estate demand is high. While no new listings were posted today in ${targetLoc}, you can browse nearby California properties under Explore!`;
  }

  // Property Type Queries (Penthouse, Villa, Apartment, Suburban)
  if (q.includes("penthouse")) {
    const penthouses = properties.filter((p) => p.type === "penthouse");
    if (penthouses.length > 0) {
      const names = penthouses.map((p) => `• **${p.title}** ($${p.price?.toLocaleString()})`).join("\n");
      return `Nestly currently features top skyline penthouses:\n\n${names}\n\nThey feature floor-to-ceiling glass walls, private elevators, and high-floor views.`;
    }
  }

  if (q.includes("villa") || q.includes("estate")) {
    const villas = properties.filter((p) => p.type === "villa");
    if (villas.length > 0) {
      const names = villas.map((p) => `• **${p.title}** ($${p.price?.toLocaleString()})`).join("\n");
      return `Nestly features luxury private villas:\n\n${names}\n\nThey feature infinity pools, gated grounds, and premium security.`;
    }
  }

  // Selling / Listing Queries
  if (q.includes("sell") || q.includes("list") || q.includes("post")) {
    return `To list your home for sale on Nestly:\n1. Open your **User Dashboard**\n2. Click **"Post New Property"** (` + "`/dashboard/add`" + `)\n3. Enter property title, price, location, photos, and descriptions\n4. Submit for Admin approval!`;
  }

  // Default response with website catalog overview
  return `Hello! I am Nestly AI. Nestly currently has **${properties.length} active property listings** on the platform spanning luxury penthouses, private villas, and urban apartments across San Francisco, Malibu, and Beverly Hills. How can I help you find your dream home today?`;
};

module.exports = { getAIChatResponse };
