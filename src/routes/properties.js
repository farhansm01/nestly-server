const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const {
  getProperties,
  getPropertyById,
  getMyProperties,
} = require("../controllers/properties");

// Public route: fetch all active listings (with filters, pagination, search)
router.get("/", getProperties);

// Protected route: fetch current user's owned listings
router.get("/user/my", requireAuth, getMyProperties);

// Public route: fetch single listing details by ID
router.get("/:id", getPropertyById);

module.exports = router;
