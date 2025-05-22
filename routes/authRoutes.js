const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();
const {
  signup,
  verifyOtp,
  login,
  logout,
} = require("../controllers/authController");

// POST request for signup
router.post("/signup", signup);
// POST request for OTP verification
router.post("/verifyOtp", verifyOtp);
// POST request for signin
router.post("/login", login);
// Get request for logout
router.get("/logout", logout);

module.exports = router;

module.exports = router;
