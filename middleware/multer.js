// middleware/multer.js
const path = require("path");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// Dynamic Cloudinary storage with folder from req.body.category
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const fileName = path.parse(file.originalname).name;
    const category = req.query.category || "uncategorized"; // Default to 'uncategorized' if no category is passed
    return {
      folder: category,
      allowed_formats: ["jpg", "jpeg", "png", "webp"], // Valid formats
      public_id: `${fileName}`, // Unique ID for each file
    };
  },
});

// Set up multer to use Cloudinary storage
const upload = multer({ storage: storage });

module.exports = { upload };
