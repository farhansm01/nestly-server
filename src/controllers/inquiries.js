const Inquiry = require("../models/Inquiry");
const Property = require("../models/Property");

/**
 * POST /api/inquiries
 * Submit a tour request or buyer inquiry for a property
 */
const createInquiry = async (req, res) => {
  try {
    const { propertyId, propertyTitle, name, email, phone, preferredDate, message } = req.body;

    if (!propertyId || !name || !email) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: propertyId, name, email",
      });
    }

    let sellerId = "";
    let finalTitle = propertyTitle || "";

    // Fetch property to attach sellerId if available
    const property = await Property.findById(propertyId);
    if (property) {
      sellerId = property.sellerId || "";
      if (!finalTitle) finalTitle = property.title;
    }

    const buyerId = req.user?.id || req.user?._id || "";

    const inquiry = new Inquiry({
      propertyId: String(propertyId),
      propertyTitle: finalTitle,
      sellerId,
      buyerId: String(buyerId),
      name,
      email,
      phone: phone || "",
      preferredDate: preferredDate || "",
      message: message || "",
      status: "Pending",
    });

    const savedInquiry = await inquiry.save();

    return res.status(201).json({
      success: true,
      message: "Inquiry submitted successfully",
      data: savedInquiry,
    });
  } catch (error) {
    console.error("Error creating inquiry:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit inquiry",
      error: error.message,
    });
  }
};

/**
 * GET /api/inquiries/my
 * Fetch inquiries received by a seller or submitted by a buyer
 */
const getMyInquiries = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User identification missing",
      });
    }

    const stringUserId = String(userId);

    // Fetch inquiries where user is either buyer or seller
    const inquiries = await Inquiry.find({
      $or: [{ buyerId: stringUserId }, { sellerId: stringUserId }],
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: inquiries,
    });
  } catch (error) {
    console.error("Error fetching my inquiries:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch inquiries",
      error: error.message,
    });
  }
};

module.exports = {
  createInquiry,
  getMyInquiries,
};
