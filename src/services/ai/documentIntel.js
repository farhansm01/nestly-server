const { ai } = require("../../lib/gemini");

/**
 * Service to analyze lease agreements and real estate documents using Gemini AI
 */
const auditLeaseDocument = async (documentText) => {
  if (!documentText || documentText.trim().length === 0) {
    throw new Error("Document text is empty or invalid.");
  }

  if (!ai) {
    return {
      summary: "Document received. Set GEMINI_API_KEY for deep AI intelligence auditing.",
      keyTerms: {
        monthlyRent: "Extracted from agreement",
        securityDeposit: "Standard 1 month",
        leaseDuration: "12 Months",
      },
      flaggedClauses: [
        "Ensure utility bill split terms are clarified in writing.",
        "Check notice period prior to non-renewal.",
      ],
      actionItems: ["Sign and retain a signed digital copy."],
    };
  }

  try {
    const prompt = `
You are an expert Real Estate Legal & Lease Auditor AI.
Analyze the following lease agreement / contract text and produce a structured audit summary.

Lease Document Text:
"""
${documentText.slice(0, 10000)}
"""

Return ONLY a valid JSON object matching this exact structure:
{
  "summary": "Executive summary of the agreement (2-3 sentences)",
  "keyTerms": {
    "monthlyRent": "Amount or N/A",
    "securityDeposit": "Amount or N/A",
    "leaseDuration": "Duration or N/A",
    "commencementDate": "Date or N/A"
  },
  "monthlyObligations": ["List of monthly fees/costs for tenant"],
  "flaggedClauses": ["List of risk clauses, unexpected fees, or strict penalties tenant should review"],
  "actionItems": ["Recommended action items before signing"]
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const responseText = response.text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return { summary: responseText, keyTerms: {}, flaggedClauses: [], actionItems: [] };
  } catch (error) {
    console.error("Gemini document audit error:", error);
    throw new Error(`Failed to audit document: ${error.message}`);
  }
};

module.exports = { auditLeaseDocument };
