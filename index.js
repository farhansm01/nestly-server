require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./src/lib/db");
const errorHandler = require("./src/middleware/errorHandler");

const app = express();

// Connect Database
connectDB();

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://nestly-client-silk.vercel.app",
  process.env.CLIENT_URL,
  process.env.ALLOWED_ORIGIN,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  })
);
app.use(express.json());

// Health Check
app.get("/health", (req, res) => res.json({ status: "ok" }));

// API Routes
app.use("/api/properties", require("./src/routes/properties"));
app.use("/api/inquiries", require("./src/routes/inquiries"));
app.use("/api/favorites", require("./src/routes/favorites"));
app.use("/api/reviews", require("./src/routes/reviews"));
app.use("/api/newsletter", require("./src/routes/newsletter"));
app.use("/api/ai", require("./src/routes/ai"));
app.use("/api/admin", require("./src/routes/admin"));

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
