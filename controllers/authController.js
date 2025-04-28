const User = require("../models/User");
const generateOtp = require("../utils/generateOtp"); // Utility to generate OTP
const sendEmail = require("../utils/sendEmail"); // Utility to send email via SendGrid

// Signup function
const signup = async (req, res) => {
  const { name, email, password, phone, role, addresses } = req.body;

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Email already exists." });
    }

    // Create new user
    const newUser = new User({ name, email, password, phone, role, addresses });

    // Generate OTP and store in the user document
    const otp = generateOtp();
    newUser.otp = otp;
    newUser.otpExpiry = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes

    // Save the new user to the database
    await newUser.save();

    // Send OTP via email (Using SendGrid)
    await sendEmail(email, otp);

    res.status(201).json({
      status: 1,
      message:
        "Signup successful! Please check your email for OTP verification.",
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ status: 0, message: "Server error, please try again." });
  }
};

// OTP verification function
const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found." });
    }

    // Check if OTP is valid and not expired
    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP." });
    }
    if (user.otpExpiry < Date.now()) {
      return res.status(400).json({ message: "OTP has expired." });
    }

    // Mark user as verified and clear OTP
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.status(200).json({ message: "OTP verified successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error, please try again." });
  }
};

// Exporting functions
module.exports = {
  signup,
  verifyOtp,
};
