const { getAIRecommendations } = require("../services/ai/recommendation");
const { auditLeaseDocument } = require("../services/ai/documentIntel");
const { getAIChatResponse } = require("../services/ai/chatAssistant");

/**
 * POST /api/ai/recommend
 * Smart Recommendation Engine endpoint
 */
const recommendProperties = async (req, res) => {
  try {
    const preferences = req.body || {};
    const recommendations = await getAIRecommendations(preferences);
    return res.status(200).json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    console.error("AI Recommendation controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate AI property recommendations",
      error: error.message,
    });
  }
};

/**
 * POST /api/ai/lease-audit
 * AI Document Intelligence endpoint for lease auditing
 */
const leaseAudit = async (req, res) => {
  try {
    const { documentText } = req.body;
    if (!documentText) {
      return res.status(400).json({
        success: false,
        message: "Missing required field: documentText",
      });
    }

    const auditResult = await auditLeaseDocument(documentText);
    return res.status(200).json({
      success: true,
      data: auditResult,
    });
  } catch (error) {
    console.error("AI Lease Audit controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to perform lease audit",
      error: error.message,
    });
  }
};

/**
 * POST /api/ai/chat
 * AI Chat Assistant endpoint
 */
const chatAssistant = async (req, res) => {
  try {
    const { message, history, propertyContext } = req.body;
    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Missing required field: message",
      });
    }

    const reply = await getAIChatResponse({ message, history, propertyContext });
    return res.status(200).json({
      success: true,
      data: { reply },
    });
  } catch (error) {
    console.error("AI Chat controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process chat message",
      error: error.message,
    });
  }
};

module.exports = {
  recommendProperties,
  leaseAudit,
  chatAssistant,
};
