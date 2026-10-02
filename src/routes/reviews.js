const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const {
  getPropertyReviews,
  getRecentReviews,
  createOrUpdateReview,
  deleteReview,
} = require("../controllers/reviews");

// Public route: fetch recent verified reviews across all properties for homepage
router.get("/recent", getRecentReviews);

// Public route: fetch all reviews for a specific property
router.get("/property/:propertyId", getPropertyReviews);

// Protected routes: submit/update review, delete review
router.post("/", requireAuth, createOrUpdateReview);
router.delete("/:id", requireAuth, deleteReview);

module.exports = router;
