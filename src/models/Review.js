const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true, default: "Anonymous Buyer" },
    userEmail: { type: String },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  {
    timestamps: true,
  }
);

// Compound index to optimize lookups by property + user
reviewSchema.index({ propertyId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.models.Review || mongoose.model("Review", reviewSchema);
