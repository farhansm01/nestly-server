const mongoose = require("mongoose");

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;

  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    console.error("MONGODB_URI is missing in environment variables.");
    return;
  }

  try {
    await mongoose.connect(mongoURI, {
      dbName: process.env.DB_NAME || "nestify",
    });
    console.log("MongoDB connected successfully.");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
  }
};

module.exports = connectDB;
