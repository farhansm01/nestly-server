const express = require("express");
const router = express.Router();
const { subscribe, getSubscribers } = require("../controllers/newsletter");

router.post("/subscribe", subscribe);
router.get("/subscribers", getSubscribers);

module.exports = router;
