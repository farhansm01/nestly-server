require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));

// routes mount here as you build them, e.g.:
// app.use("/api/properties", require("./src/routes/properties"));
// app.use("/api/ai", require("./src/routes/ai"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));