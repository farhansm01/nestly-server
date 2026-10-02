const mongoose = require("mongoose");
const Review = require("../models/Review");
const Property = require("../models/Property");

/**
 * Helper to recalculate and update property average rating & total review count
 */
const updatePropertyRatingStats = async (propertyId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(propertyId)) return { averageRating: 0, reviewCount: 0 };

    const propObjectId = new mongoose.Types.ObjectId(propertyId);
    const stats = await Review.aggregate([
      { $match: { propertyId: propObjectId } },
      {
        $group: {
          _id: "$propertyId",
          avgRating: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
    ]);

    const avg = stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0;
    const count = stats.length > 0 ? stats[0].count : 0;

    await Property.findByIdAndUpdate(propertyId, {
      averageRating: avg,
      rating: avg,
      reviewCount: count,
    });

    return { averageRating: avg, reviewCount: count };
  } catch (err) {
    console.error("Error recalculating property rating stats:", err);
    return { averageRating: 0, reviewCount: 0 };
  }
};

/**
 * GET /api/reviews/recent
 * Fetch recent verified reviews across all properties for homepage testimonials
 */
const getRecentReviews = async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    const limitNum = Math.max(1, parseInt(limit, 10) || 6);

    const reviews = await Review.find()
      .populate("propertyId", "title location image type")
      .sort({ createdAt: -1 })
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    console.error("Error fetching recent reviews:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch recent reviews",
      error: error.message,
    });
  }
};

/**
 * GET /api/reviews/property/:propertyId
 * Get all reviews and aggregate summary for a property
 */
const getPropertyReviews = async (req, res) => {
  try {
    const { propertyId } = req.params;

    if (!propertyId || !mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(200).json({
        success: true,
        data: [],
        summary: {
          averageRating: 0,
          totalCount: 0,
          distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        },
      });
    }

    const reviews = await Review.find({ propertyId }).sort({ createdAt: -1 });

    // Calculate rating distribution breakdown
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalScore = 0;

    reviews.forEach((r) => {
      if (distribution[r.rating] !== undefined) {
        distribution[r.rating] += 1;
      }
      totalScore += r.rating;
    });

    const totalCount = reviews.length;
    const averageRating = totalCount > 0 ? Math.round((totalScore / totalCount) * 10) / 10 : 0;

    return res.status(200).json({
      success: true,
      data: reviews,
      summary: {
        averageRating,
        totalCount,
        distribution,
      },
    });
  } catch (error) {
    console.error("Error fetching property reviews:", error);
    return res.status(200).json({
      success: true,
      data: [],
      summary: {
        averageRating: 0,
        totalCount: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      },
    });
  }
};

/**
 * POST /api/reviews
 * Create or update a property review
 */
const createOrUpdateReview = async (req, res) => {
  try {
    const { propertyId, rating, comment } = req.body;
    const userId = req.user?.id || req.user?._id;
    const userName = req.user?.name || req.user?.userName || req.user?.email?.split("@")[0] || "Verified Buyer";
    const userEmail = req.user?.email || "";

    if (!propertyId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: "Missing required review fields (propertyId, rating, comment)",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(propertyId)) {
      return res.status(400).json({
        success: false,
        message: "Cannot post reviews to sample or invalid property IDs",
      });
    }

    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be a number between 1 and 5",
      });
    }

    if (comment.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: "Review comment must be at least 3 characters long",
      });
    }

    // Fetch target property
    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property listing not found",
      });
    }

    // Rule: Seller cannot review their own property
    if (String(property.sellerId) === String(userId)) {
      return res.status(403).json({
        success: false,
        message: "Property owners are not permitted to rate or review their own listings",
      });
    }

    // Check if user already reviewed this property
    let review = await Review.findOne({ propertyId, userId });
    let isUpdate = false;

    if (review) {
      isUpdate = true;
      review.rating = numericRating;
      review.comment = comment.trim();
      review.userName = userName;
      review.userEmail = userEmail;
      await review.save();
    } else {
      review = await Review.create({
        propertyId,
        userId: String(userId),
        userName,
        userEmail,
        rating: numericRating,
        comment: comment.trim(),
      });
    }

    // Update Property average stats
    const stats = await updatePropertyRatingStats(propertyId);

    return res.status(isUpdate ? 200 : 201).json({
      success: true,
      message: isUpdate ? "Your review has been updated" : "Review submitted successfully",
      data: review,
      stats,
    });
  } catch (error) {
    console.error("Error submitting review:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit review",
      error: error.message,
    });
  }
};

/**
 * DELETE /api/reviews/:id
 * Delete a property review by ID
 */
const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.user?._id;
    const isAdmin = req.user?.role === "admin" || req.user?.isInternal === true;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    const isAuthor = String(review.userId) === String(userId);
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not authorized to delete this review",
      });
    }

    const propertyId = review.propertyId;
    await Review.findByIdAndDelete(id);

    // Recalculate property rating stats
    const stats = await updatePropertyRatingStats(propertyId);

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully",
      stats,
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete review",
      error: error.message,
    });
  }
};

module.exports = {
  getPropertyReviews,
  getRecentReviews,
  createOrUpdateReview,
  deleteReview,
};
