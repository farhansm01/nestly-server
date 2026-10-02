const Subscriber = require("../models/Subscriber");

// POST /api/newsletter/subscribe
exports.subscribe = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email || !email.includes("@")) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await Subscriber.findOne({ email: cleanEmail });

    if (existing) {
      if (existing.status === "active") {
        return res.status(200).json({
          success: true,
          message: "You are already subscribed to AI market alerts!",
          alreadySubscribed: true,
        });
      }
      existing.status = "active";
      await existing.save();
      return res.status(200).json({
        success: true,
        message: "Welcome back! Re-subscribed to AI market alerts.",
      });
    }

    await Subscriber.create({ email: cleanEmail });
    return res.status(201).json({
      success: true,
      message: "Successfully subscribed! You will receive instant AI real estate market alerts.",
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/newsletter/subscribers
exports.getSubscribers = async (req, res, next) => {
  try {
    const count = await Subscriber.countDocuments({ status: "active" });
    const subscribers = await Subscriber.find({ status: "active" }).select("email subscribedAt").sort("-subscribedAt");
    return res.json({
      success: true,
      count,
      data: subscribers,
    });
  } catch (error) {
    next(error);
  }
};
