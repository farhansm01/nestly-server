require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./src/lib/db");

const app = express();

// Connect Database
connectDB();

app.use(
  cors({
    origin: process.env.CLIENT_URL || process.env.ALLOWED_ORIGIN || "*",
    credentials: true,
  })
);
app.use(express.json());

// Health Check
app.get("/health", (req, res) => res.json({ status: "ok" }));

// Routes
app.use("/api/properties", require("./src/routes/properties"));
app.use("/api/inquiries", require("./src/routes/inquiries"));
app.use("/api/favorites", require("./src/routes/favorites"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));