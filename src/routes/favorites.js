const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");
const { getFavorites, addFavorite, removeFavorite } = require("../controllers/favorites");

router.get("/", requireAuth, getFavorites);
router.post("/:propertyId", requireAuth, addFavorite);
router.delete("/:propertyId", requireAuth, removeFavorite);

module.exports = router;
