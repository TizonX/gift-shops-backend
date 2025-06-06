const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  getUserProfile,
  updateUserProfile,
  addToCart,
  removeFromCart,
  getCart,
  updateCartItemQuantity,
} = require("../controllers/userController");

// Profile routes
router.get("/profile", authMiddleware, getUserProfile);
router.put("/profile", authMiddleware, updateUserProfile);

// Cart routes
router.get("/cart", authMiddleware, getCart);
router.post("/cart", authMiddleware, addToCart);
router.delete("/cart/:itemId", authMiddleware, removeFromCart);
router.put("/cart/:itemId", authMiddleware, updateCartItemQuantity);

module.exports = router;
