const express = require("express");
const router = express.Router();
const { optionalAuth } = require("../middleware/auth");
const { recommendProperties, leaseAudit, chatAssistant } = require("../controllers/ai");

// AI Property Recommendations
router.post("/recommend", optionalAuth, recommendProperties);

// AI Lease Document Audit
router.post("/lease-audit", optionalAuth, leaseAudit);

// AI Chat Assistant
router.post("/chat", optionalAuth, chatAssistant);

module.exports = router;
