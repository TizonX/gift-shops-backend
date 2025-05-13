// config/cloudinary.js
const cloudinary = require("cloudinary").v2;
require("dotenv").config(); // Load CLOUDINARY_URL

cloudinary.config(); // Will read CLOUDINARY_URL from .env

module.exports = cloudinary;
