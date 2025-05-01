const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();
const { signup, verifyOtp, login } = require("../controllers/authController");

// POST request for signup
router.post("/signup", signup);
// POST request for OTP verification
router.post("/verifyOtp", verifyOtp);
// POST request for signin
router.post("/login", login);

module.exports = router;

module.exports = router;
