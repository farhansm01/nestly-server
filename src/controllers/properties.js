const { sendNewPropertyAlert } = require("../lib/mailer");
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

    const query = { status: { $nin: ["Pending", "pending", "Rejected", "rejected"] } };

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

/**
 * POST /api/properties
 * Create a new property listing with support for multiple images
 */
const createProperty = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const userName = req.user?.name || "Seller";

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Seller identification missing",
      });
    }

    const {
      title,
      type,
      price,
      location,
      city,
      shortDesc,
      fullDesc,
      beds,
      baths,
      sqft,
      yearBuilt,
      image,
      images,
      gallery,
      amenities,
    } = req.body;

    // Collect all image URLs from image, images, or gallery fields
    let allImageUrls = [];
    if (typeof image === "string" && image.trim()) allImageUrls.push(image.trim());
    else if (Array.isArray(image)) allImageUrls.push(...image);

    if (Array.isArray(images)) allImageUrls.push(...images);
    if (Array.isArray(gallery)) allImageUrls.push(...gallery);

    allImageUrls = Array.from(
      new Set(allImageUrls.filter((url) => typeof url === "string" && url.trim().length > 0))
    );

    if (!title || !type || price === undefined || !location || !shortDesc || allImageUrls.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Missing required property fields (title, type, price, location, shortDesc, image/images)",
      });
    }

    const primaryImage = allImageUrls[0];

    const newProperty = new Property({
      title,
      type: String(type).toLowerCase(),
      price: Number(price),
      formattedPrice: `$${Number(price).toLocaleString("en-US")}`,
      location,
      city: city || location.split(",").pop().trim(),
      shortDesc,
      fullDesc: fullDesc || shortDesc,
      beds: Number(beds) || 0,
      baths: Number(baths) || 0,
      sqft: sqft || "",
      yearBuilt: yearBuilt || "",
      image: primaryImage,
      gallery: allImageUrls,
      images: allImageUrls,
      amenities: amenities || [],
      sellerId: String(userId),
      sellerName: userName,
      status: "Pending",
    });

    const savedProperty = await newProperty.save();
    sendNewPropertyAlert(savedProperty).catch((err) => console.error('Mailer Error:', err));

    return res.status(201).json({
      success: true,
      message: "Property listing created successfully",
      data: savedProperty,
    });
  } catch (error) {
    console.error("Error creating property:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create property listing",
      error: error.message,
    });
  }
};

/**
 * PUT /api/properties/:id
 * Update an existing property listing
 */
const updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.user?._id;

    const property = await Property.findById(id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property listing not found",
      });
    }

    // Owner or admin authorization check
    const isOwner = String(property.sellerId) === String(userId);
    const isAdmin = req.user?.role === "admin" || req.user?.isInternal === true;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not authorized to update this listing",
      });
    }

    // Update fields
    const allowedFields = [
      "title",
      "type",
      "price",
      "location",
      "city",
      "shortDesc",
      "fullDesc",
      "beds",
      "baths",
      "sqft",
      "yearBuilt",
      "image",
      "images",
      "gallery",
      "amenities",
      "status",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === "type") {
          property[field] = String(req.body[field]).toLowerCase();
        } else if (field === "price") {
          property.price = Number(req.body.price);
          property.formattedPrice = `$${Number(req.body.price).toLocaleString("en-US")}`;
        } else {
          property[field] = req.body[field];
        }
      }
    });

    const updatedProperty = await property.save();

    return res.status(200).json({
      success: true,
      message: "Property listing updated successfully",
      data: updatedProperty,
    });
  } catch (error) {
    console.error("Error updating property:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update property listing",
      error: error.message,
    });
  }
};

/**
 * DELETE /api/properties/:id
 * Delete a property listing by ID
 */
const deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.user?._id;

    const property = await Property.findById(id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property listing not found",
      });
    }

    const isOwner = String(property.sellerId) === String(userId);
    const isAdmin = req.user?.role === "admin" || req.user?.isInternal === true;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not authorized to delete this listing",
      });
    }

    await Property.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Property deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting property:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete property listing",
      error: error.message,
    });
  }
};

/**
 * GET /api/properties/admin/all
 * Fetch ALL properties across all users for admin with search & status filtering
 */
const getAllPropertiesAdmin = async (req, res) => {
  try {
    const { search = "", status = "", type = "", sort = "newest" } = req.query;

    const query = {};

    if (search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [
        { title: regex },
        { location: regex },
        { city: regex },
        { sellerName: regex },
      ];
    }

    if (status.trim() && status.toLowerCase() !== "all") {
      const st = status.trim();
      query.status = new RegExp(`^${st}$`, "i");
    }

    if (type.trim()) {
      query.type = type.trim().toLowerCase();
    }

    let sortOptions = { createdAt: -1 };
    if (sort === "price-asc") sortOptions = { price: 1 };
    else if (sort === "price-desc") sortOptions = { price: -1 };
    else if (sort === "oldest") sortOptions = { createdAt: 1 };

    const properties = await Property.find(query).sort(sortOptions);

    return res.status(200).json({
      success: true,
      data: properties,
      total: properties.length,
    });
  } catch (error) {
    console.error("Error fetching admin properties:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch all property listings",
      error: error.message,
    });
  }
};

/**
 * PATCH /api/properties/:id/status
 * Update property approval status (Approved, Rejected, Pending, Active)
 */
const updatePropertyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || typeof status !== "string") {
      return res.status(400).json({
        success: false,
        message: "Missing or invalid status parameter",
      });
    }

    const property = await Property.findById(id);

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property listing not found",
      });
    }

    property.status = status.charAt(0).toUpperCase() + status.slice(1);
    const updated = await property.save();

    return res.status(200).json({
      success: true,
      message: `Property status updated to '${property.status}'`,
      data: updated,
    });
  } catch (error) {
    console.error("Error updating property status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update property status",
      error: error.message,
    });
  }
};

module.exports = {
  getProperties,
  getPropertyById,
  getMyProperties,
  createProperty,
  updateProperty,
  deleteProperty,
  getAllPropertiesAdmin,
  updatePropertyStatus,
};
