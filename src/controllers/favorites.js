const Favorite = require("../models/Favorite");
const Property = require("../models/Property");

/**
 * GET /api/favorites
 * List saved properties for the logged-in buyer
 */
const getFavorites = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User identification missing",
      });
    }

    const favorites = await Favorite.find({ userId: String(userId) }).sort({ createdAt: -1 });
    const propertyIds = favorites.map((fav) => fav.propertyId);

    const properties = await Property.find({ _id: { $in: propertyIds } });

    return res.status(200).json({
      success: true,
      data: properties,
    });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch saved properties",
      error: error.message,
    });
  }
};

/**
 * POST /api/favorites/:propertyId
 * Add property to buyer's saved shortlist
 */
const addFavorite = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User identification missing",
      });
    }

    await Favorite.findOneAndUpdate(
      { userId: String(userId), propertyId: String(propertyId) },
      { userId: String(userId), propertyId: String(propertyId) },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Property added to favorites successfully",
    });
  } catch (error) {
    console.error("Error adding favorite:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add property to favorites",
      error: error.message,
    });
  }
};

/**
 * DELETE /api/favorites/:propertyId
 * Remove property from saved shortlist
 */
const removeFavorite = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User identification missing",
      });
    }

    await Favorite.findOneAndDelete({
      userId: String(userId),
      propertyId: String(propertyId),
    });

    return res.status(200).json({
      success: true,
      message: "Property removed from favorites successfully",
    });
  } catch (error) {
    console.error("Error removing favorite:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove property from favorites",
      error: error.message,
    });
  }
};

module.exports = {
  getFavorites,
  addFavorite,
  removeFavorite,
};
