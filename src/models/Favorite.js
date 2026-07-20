const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    propertyId: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

favoriteSchema.index({ userId: 1, propertyId: 1 }, { unique: true });

module.exports = mongoose.models.Favorite || mongoose.model("Favorite", favoriteSchema);
