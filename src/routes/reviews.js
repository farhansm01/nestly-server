const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const {
  getPropertyReviews,
  createOrUpdateReview,
  deleteReview,
} = require("../controllers/reviews");

// Public route: fetch all reviews for a property
router.get("/property/:propertyId", getPropertyReviews);

// Protected routes: submit/update review, delete review
router.post("/", requireAuth, createOrUpdateReview);
router.delete("/:id", requireAuth, deleteReview);

module.exports = router;
