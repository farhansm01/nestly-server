const express = require("express");
const router = express.Router();
const { requireAuth, optionalAuth } = require("../middleware/auth");
const { createInquiry, getMyInquiries } = require("../controllers/inquiries");

// Submit inquiry / tour request
router.post("/", optionalAuth, createInquiry);

// Get inquiries for logged-in user (buyer or seller)
router.get("/my", requireAuth, getMyInquiries);

module.exports = router;
