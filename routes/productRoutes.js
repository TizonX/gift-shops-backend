const express = require("express");
const router = express.Router();
const { upload } = require("../middleware/multer");
const { csvUpload } = require("../middleware/csvMulter");
const authMiddleware = require("../middleware/authMiddleware");
const { uploadCSV } = require("../controllers/productController");
const authorizeRole = require("../middleware/authorizeRole");

router.post(
  "/upload-product-images",
  upload.array("upload", 10),
  async (req, res) => {
    const { files, body } = req;
    const { category } = body;

    if (!files || files.length === 0 || !category) {
      return res
        .status(400)
        .json({ error: "Images and category are required." });
    }

    try {
      // Cloudinary returns secure_url for each uploaded image
      const fileUrls = files.map((file) => file.path); // .path holds `the Cloudinary URL

      res.status(200).json({
        message: "Files uploaded to Cloudinary successfully",
        fileUrls,
      });
    } catch (err) {
      console.error("Cloudinary Upload Error:", err);
      res.status(500).json({ error: "Image upload failed" });
    }
  }
);

// csv upload
router.post(
  "/upload-csv",
  authMiddleware,
  authorizeRole(...["admin", "vendor"]),
  csvUpload.single("file"),
  uploadCSV
);
module.exports = router;
