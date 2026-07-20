const mongoose = require("mongoose");
const Property = require("../models/Property");

/**
 * GET /api/admin/stats
 * Fetch live platform metrics
 */
const getAdminStats = async (req, res) => {
  try {
    const User = mongoose.connection.collection("user");

    const totalUsers = await User.countDocuments({});
    const totalProperties = await Property.countDocuments({});
    const pendingApprovals = await Property.countDocuments({
      status: { $in: ["Pending", "pending"] },
    });
    const approvedProperties = await Property.countDocuments({
      status: { $nin: ["Pending", "pending", "Rejected", "rejected"] },
    });
    const restrictedUsers = await User.countDocuments({ status: "restricted" });

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalProperties,
        pendingApprovals,
        approvedProperties,
        restrictedUsers,
      },
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin statistics",
      error: error.message,
    });
  }
};

/**
 * GET /api/admin/users
 * Fetch all registered users with search, role, status filtering, and sorting
 */
const getAllUsers = async (req, res) => {
  try {
    const { search = "", role = "", status = "" } = req.query;
    const User = mongoose.connection.collection("user");

    const query = {};

    if (search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [{ name: regex }, { email: regex }];
    }

    if (role.trim()) {
      query.role = role.trim().toLowerCase();
    }

    if (status.trim()) {
      query.status = status.trim().toLowerCase();
    }

    const users = await User.find(query).sort({ createdAt: -1 }).toArray();

    return res.status(200).json({
      success: true,
      data: users,
      total: users.length,
    });
  } catch (error) {
    console.error("Error fetching users for admin:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user list",
      error: error.message,
    });
  }
};

/**
 * PATCH /api/admin/users/:id/status
 * Restrict or Activate a user account
 */
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "restricted"].includes(String(status).toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Allowed values: 'active' or 'restricted'",
      });
    }

    const User = mongoose.connection.collection("user");
    const objectId = new mongoose.Types.ObjectId(id);

    const result = await User.updateOne(
      { _id: objectId },
      { $set: { status: String(status).toLowerCase(), updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User account not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `User status updated to '${status}' successfully`,
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update user status",
      error: error.message,
    });
  }
};

/**
 * PATCH /api/admin/users/:id/role
 * Update user role (e.g. user vs admin)
 */
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || typeof role !== "string") {
      return res.status(400).json({
        success: false,
        message: "Missing or invalid role parameter",
      });
    }

    const User = mongoose.connection.collection("user");
    const objectId = new mongoose.Types.ObjectId(id);

    const result = await User.updateOne(
      { _id: objectId },
      { $set: { role: String(role).toLowerCase(), updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User account not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: `User role updated to '${role}' successfully`,
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update user role",
      error: error.message,
    });
  }
};

/**
 * DELETE /api/admin/users/:id
 * Delete a user account from MongoDB
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const User = mongoose.connection.collection("user");
    const Account = mongoose.connection.collection("account");
    const objectId = new mongoose.Types.ObjectId(id);

    const result = await User.deleteOne({ _id: objectId });
    await Account.deleteMany({ userId: id });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User account not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User account deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete user account",
      error: error.message,
    });
  }
};

module.exports = {
  getAdminStats,
  getAllUsers,
  updateUserStatus,
  updateUserRole,
  deleteUser,
};
