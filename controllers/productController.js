const fs = require("fs");
const csv = require("csv-parser");
const Product = require("../models/Product"); // Your mongoose model or any DB model
const { safeParseJSON } = require("../utils/safeParseJSON");

const uploadCSV = (req, res) => {
  const results = [];
  let rowIndex = 0;
  if (!req.file) {
    return res.status(400).json({ message: "CSV file is required" });
  }

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (data) => {
      rowIndex++;
      // Here, data is an object where keys are your CSV headers
      // You can do data transformation here if needed

      // For example, convert price fields from string to number
      data.price = Number(data.price);
      data.discount = Number(data.discount);
      data.finalPrice = Number(data.finalPrice);
      data.stock = Number(data.stock);
      // ✅ Convert boolean fields
      data.isCustomizable = data.isCustomizable === "TRUE";
      data.giftWrapAvailable = data.giftWrapAvailable === "TRUE";
      data.giftMessageAllowed = data.giftMessageAllowed === "TRUE";
      data.isRecommended = data.isRecommended === "TRUE";
      data.limitedEdition = data.limitedEdition === "TRUE";
      // Convert JSON string fields to array or object if necessary
      data.images = safeParseJSON(data.images, "images", rowIndex);
      data.occasions = safeParseJSON(data.occasions, "occasions", rowIndex);
      data.tags = safeParseJSON(data.tags, "tags", rowIndex);
      data.customizationFields = safeParseJSON(
        data.customizationFields,
        "customizationFields",
        rowIndex
      );
      data.ratings = safeParseJSON(data.ratings, "ratings", rowIndex);
      data.seller = safeParseJSON(data.seller, "seller", rowIndex);
      data.meta = safeParseJSON(data.meta, "meta", rowIndex);

      results.push(data);
    })
    .on("end", async () => {
      // Now save all products to DB
      try {
        // Option 1: save one by one (can be slow)
        for (const productData of results) {
          // Adjust this based on your DB schema
          const product = new Product({
            ...productData,
            createdBy: req.user.id,
            updatedBy: req.user.id,
          });
          await product.save();
        }

        // Option 2: bulk insert if supported by your DB
        // await Product.insertMany(results);

        res.json({
          message: "CSV data uploaded and saved successfully",
          count: results.length,
        });
      } catch (err) {
        res
          .status(500)
          .json({ message: "Error saving data", error: err.message });
      }
    });
};

module.exports = { uploadCSV };
