const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const {
  getProperties,
  getPropertyById,
  getMyProperties,
  createProperty,
  updateProperty,
  deleteProperty,
  getAllPropertiesAdmin,
  updatePropertyStatus,
} = require("../controllers/properties");

// Public route: fetch all active listings (with filters, pagination, search)
router.get("/", getProperties);

// Admin route: fetch ALL listings across all users
router.get("/admin/all", requireAuth, getAllPropertiesAdmin);

// Protected route: fetch current user's owned listings
router.get("/user/my", requireAuth, getMyProperties);

// Public route: fetch single listing details by ID
router.get("/:id", getPropertyById);

// Protected mutation routes
router.post("/", requireAuth, createProperty);
router.put("/:id", requireAuth, updateProperty);
router.patch("/:id/status", requireAuth, updatePropertyStatus);
router.delete("/:id", requireAuth, deleteProperty);

module.exports = router;
