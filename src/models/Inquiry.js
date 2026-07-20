const mongoose = require("mongoose");

const inquirySchema = new mongoose.Schema(
  {
    propertyId: { type: String, required: true },
    propertyTitle: { type: String, trim: true },
    sellerId: { type: String },
    buyerId: { type: String },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    preferredDate: { type: String },
    message: { type: String },
    status: {
      type: String,
      default: "Pending",
      enum: ["Pending", "Responded", "Closed"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.models.Inquiry || mongoose.model("Inquiry", inquirySchema);
