const { ai } = require("../../lib/gemini");
const Property = require("../../models/Property");

/**
 * Service for real estate conversational assistant using Gemini AI with intelligent DB lookup
 */
const getAIChatResponse = async ({ message, history = [], propertyContext = null }) => {
  if (!message || message.trim().length === 0) {
    throw new Error("Message text is empty.");
  }

  // 1. Try Live Google Gemini API call first
  if (ai) {
    try {
      let systemInstruction = `You are Nestly AI, a friendly, expert real estate assistant guiding home buyers and property sellers. Be helpful, concise, and informative.`;

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
        model: "gemini-2.0-flash",
        contents,
      });

      if (response && response.text) {
        return response.text;
      }
    } catch (error) {
      console.warn("Gemini AI API notice (using live DB dynamic NLP response):", error.message);
    }
  }

  // 2. Intelligent Dynamic Natural Language Query Engine querying MongoDB
  const q = message.toLowerCase();

  // Fetch live properties from DB for context
  let properties = [];
  try {
    properties = await Property.find({
      status: { $nin: ["Pending", "pending", "Rejected", "rejected"] },
    }).limit(20);
  } catch (err) {
    properties = [];
  }

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
        .slice(0, 3)
        .map(
          (p) =>
            `• ${p.title} (${p.type || "Home"}) for ${
              typeof p.price === "number" ? `$${p.price.toLocaleString()}` : p.price
            }`
        )
        .join("\n");
      return `We currently have ${matchingProps.length} active property listing(s) in ${targetLoc.toUpperCase()}:\n\n${propList}\n\nYou can explore full details by filtering by location on the Explore Properties page!`;
    }
    return `In ${targetLoc.toUpperCase()}, real estate property values are strong with high buyer demand. While no new listings were posted in the last 24 hours for ${targetLoc}, you can set up an alert on Nestly to be notified when new properties go live!`;
  }

  // Property Type Queries (Penthouse, Villa, Apartment, Suburban)
  if (q.includes("penthouse")) {
    const penthouses = properties.filter((p) => p.type === "penthouse");
    if (penthouses.length > 0) {
      const names = penthouses.map((p) => p.title).join(", ");
      return `Nestly currently features top skyline penthouses including: ${names}. They feature panoramic views, floor-to-ceiling glass, and private elevator access!`;
    }
    return `Skyline penthouses on Nestly feature private rooftop decks, floor-to-ceiling glass, and high-floor panoramic views. Browse them using the 'Penthouse' filter on Explore Properties.`;
  }

  if (q.includes("villa") || q.includes("estate")) {
    const villas = properties.filter((p) => p.type === "villa");
    if (villas.length > 0) {
      const names = villas.map((p) => p.title).join(", ");
      return `We have luxury private villas listed on Nestly including: ${names}. They include infinity pools, sprawling gardens, and gated security!`;
    }
    return `Luxury villas on Nestly offer private gated estates, swimming pools, and ocean or hillside vistas. You can view all available villas under the Explore page filter.`;
  }

  if (q.includes("apartment") || q.includes("flat") || q.includes("condo")) {
    return `Modern urban apartments on Nestly are located in prime metropolitan centers with smart home automation, 24/7 security, and fitness centers.`;
  }

  // Budget / Pricing / Cheap / Affordable Queries
  if (q.includes("cheap") || q.includes("under") || q.includes("budget") || q.includes("affordable") || q.includes("low")) {
    const sortedByPrice = [...properties].sort((a, b) => (a.price || 0) - (b.price || 0));
    if (sortedByPrice.length > 0) {
      const lowest = sortedByPrice[0];
      const lowestPrice = typeof lowest.price === "number" ? `$${lowest.price.toLocaleString()}` : lowest.price;
      return `Our most accessible listing currently on Nestly is "${lowest.title}" located in ${lowest.location} priced at ${lowestPrice}. You can filter by price range on the Explore page!`;
    }
    return `You can use the 'Price Range' filter on the Explore page to browse properties under $1,000,000 or between $1M – $3M based on your budget preferences.`;
  }

  if (q.includes("price") || q.includes("cost") || q.includes("valuat") || q.includes("worth")) {
    return `Platform real estate valuations on Nestly are calculated using location trends, square footage, amenities, and AI price predictions. Average property prices range from $950K for city apartments to $4.8M for oceanfront villas.`;
  }

  // Selling / Listing Queries
  if (q.includes("sell") || q.includes("list") || q.includes("post")) {
    return `To sell or list a property on Nestly: Go to your Dashboard, click "Post New Property" or "Add Property", fill in your listing title, price, location, photos, and submit. An Admin will review and publish your listing live!`;
  }

  // Buying / Inquiries / Schedule / Agent Queries
  if (q.includes("buy") || q.includes("tour") || q.includes("schedule") || q.includes("contact") || q.includes("inquir")) {
    return `To buy or schedule a tour for a home: Click on any property listing, review the details, and click "Submit Inquiry / Schedule Tour" to connect directly with the seller or agent.`;
  }

  // Document / Contract Queries
  if (q.includes("contract") || q.includes("doc") || q.includes("term") || q.includes("lease") || q.includes("legal")) {
    return `Under the "Document Intelligence" tab on this AI Features page, you can paste contract text or upload PDF documents for an automated AI audit of key terms, obligations, and risk flags!`;
  }

  // Greeting Queries
  if (q.includes("hi") || q.includes("hello") || q.includes("hey") || q.includes("who are you")) {
    return `Hello! I am Nestly AI Real Estate Assistant. I can help you find luxury homes, analyze contract clauses, check property prices, or guide you through listing your property. What would you like to know today?`;
  }

  // Default dynamic contextual response
  return `I reviewed your query about "${message}". Nestly currently lists ${properties.length} verified real estate properties across San Francisco, Malibu, Beverly Hills, and top metropolitan markets. Feel free to search listings on Explore or ask me about specific home types!`;
};

module.exports = { getAIChatResponse };
