const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const validator = require('validator');

const addressSchema = new mongoose.Schema(
  {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    postalCode: { type: String },
    country: { type: String },
    label: {
      type: String,
      enum: ["home", "work", "other"],
      default: "home",
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, "Please enter a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // don't return password in queries
    },
    phone: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          return /^[0-9]{10,15}$/.test(v); // Only 10 to 15 digit numbers
        },
        message: "Please enter a valid phone number",
      },
    },
    profilePic: {
      type: String,
      default: "default-profile.png", // you can change this default later
    },
    role: {
      type: String,
      enum: ['customer', 'admin', 'vendor', 'moderator', 'guest'],
      default: "customer",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otp: {
      type: String,
    },
    otpExpiry: {
      type: Date,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpire: {
      type: Date,
    },
    addresses: [addressSchema],
  },
  {
    timestamps: true,
  }
);

// 📌 Encrypt password before saving (only if password is modified)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  // Combine password with a custom secret before hashing
  const secretKey = process.env.SECRET_KEY; // Set your secret key in .env file
  const passwordWithSecret = this.password + secretKey;
  this.password = await bcrypt.hash(passwordWithSecret, 12);
  next();
});

// 📌 Method to compare password during login
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
