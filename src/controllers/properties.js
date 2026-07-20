const Property = require("../models/Property");

/**
 * GET /api/properties
 * Fetch properties with search, filtering, sorting, and pagination
 */
const getProperties = async (req, res) => {
  try {
    const {
      search = "",
      type = "",
      minPrice = 0,
      maxPrice = Number.MAX_SAFE_INTEGER,
      beds = 0,
      sort = "newest",
      page = 1,
      limit = 12,
    } = req.query;

    const query = { status: "Active" };

    // Search filter across title, location, city, shortDesc
    if (search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [
        { title: regex },
        { location: regex },
        { city: regex },
        { shortDesc: regex },
      ];
    }

    // Type filter
    if (type.trim()) {
      query.type = type.trim().toLowerCase();
    }

    // Price range filter
    const minP = Number(minPrice) || 0;
    const maxP = Number(maxPrice) || Number.MAX_SAFE_INTEGER;
    query.price = { $gte: minP, $lte: maxP };

    // Bedrooms filter
    if (beds && Number(beds) > 0) {
      query.beds = { $gte: Number(beds) };
    }

    // Sorting
    let sortOptions = { createdAt: -1 };
    if (sort === "price-asc") {
      sortOptions = { price: 1 };
    } else if (sort === "price-desc") {
      sortOptions = { price: -1 };
    } else if (sort === "rating") {
      sortOptions = { rating: -1 };
    } else if (sort === "newest") {
      sortOptions = { createdAt: -1 };
    }

    // Pagination calculation
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 12);
    const skip = (pageNum - 1) * limitNum;

    const total = await Property.countDocuments(query);
    const properties = await Property.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      data: properties,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    console.error("Error fetching properties:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch properties",
      error: error.message,
    });
  }
};

/**
 * GET /api/properties/:id
 * Fetch single property details by ID
 */
const getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;

    const property = await Property.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property listing not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: property,
    });
  } catch (error) {
    console.error("Error fetching property by ID:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch property details",
      error: error.message,
    });
  }
};

/**
 * GET /api/properties/user/my
 * Fetch properties created by the currently logged-in user
 */
const getMyProperties = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User identification missing",
      });
    }

    const properties = await Property.find({ sellerId: String(userId) }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: properties,
    });
  } catch (error) {
    console.error("Error fetching user properties:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user property listings",
      error: error.message,
    });
  }
};

module.exports = {
  getProperties,
  getPropertyById,
  getMyProperties,
};
