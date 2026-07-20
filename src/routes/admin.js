const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const {
  getAdminStats,
  getAllUsers,
  updateUserStatus,
  updateUserRole,
  deleteUser,
} = require("../controllers/admin");

// Apply auth middleware to all admin routes
router.use(auth);

// Admin platform metrics
router.get("/stats", getAdminStats);

// User Governance endpoints
router.get("/users", getAllUsers);
router.patch("/users/:id/status", updateUserStatus);
router.patch("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);

module.exports = router;
