const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    type: {
      type: String,
      required: true,
      enum: ["apartment", "villa", "penthouse", "suburban"],
      lowercase: true,
    },
    price: { type: Number, required: true, min: 0 },
    formattedPrice: { type: String },
    location: { type: String, required: true, trim: true },
    city: { type: String, trim: true },
    shortDesc: { type: String, required: true },
    fullDesc: { type: String },
    beds: { type: Number, default: 0 },
    baths: { type: Number, default: 0 },
    sqft: { type: String },
    yearBuilt: { type: String },
    image: { type: String, required: true },
    gallery: [{ type: String }],
    images: [{ type: String }],
    amenities: [{ type: String }],
    sellerId: { type: String, required: true },
    sellerName: { type: String, default: "Anonymous Seller" },
    status: { type: String, default: "Active", enum: ["Active", "Pending", "Sold"] },
    views: { type: Number, default: 0 },
    rating: { type: Number, default: 5.0 },
  },
  {
    timestamps: true,
  }
);

// Format price & sync gallery/images before saving
propertySchema.pre("save", function (next) {
  if (!this.formattedPrice && this.price !== undefined) {
    this.formattedPrice = `$${this.price.toLocaleString("en-US")}`;
  }

  // Combine image, gallery, and images into a clean unique array
  const allImages = Array.from(
    new Set(
      [
        this.image,
        ...(Array.isArray(this.gallery) ? this.gallery : []),
        ...(Array.isArray(this.images) ? this.images : []),
      ].filter(Boolean)
    )
  );

  if (!this.image && allImages.length > 0) {
    this.image = allImages[0];
  }

  this.gallery = allImages;
  this.images = allImages;

  next();
});

module.exports = mongoose.models.Property || mongoose.model("Property", propertySchema);
