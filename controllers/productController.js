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
// get all products
const getProducts = async (req, res) => {
  let { category, brand, price, page = 1, limit = 10 } = req.query;

  page = parseInt(page);
  limit = parseInt(limit);

  // Convert category and brand to arrays if they are comma-separated strings
  if (typeof category === "string") category = category.split(",");
  if (typeof brand === "string") brand = brand.split(",");

  // Parse price ranges (like "100-200,300-400")
  let priceRanges = [];
  if (price) {
    if (typeof price === "string") {
      priceRanges = price.split(",").map((range) => {
        const [min, max] = range.split("-").map(Number);
        return { min, max };
      });
    } else if (Array.isArray(price)) {
      priceRanges = price
        .join(",")
        .split(",")
        .map((range) => {
          const [min, max] = range.split("-").map(Number);
          return { min, max };
        });
    }
  }

  // Build MongoDB query object
  const query = {};

  // Add category filter if exists
  if (category && category.length > 0) {
    query.category = { $in: category };
  }

  // Add brand filter if exists
  if (brand && brand.length > 0) {
    query.brand = { $in: brand };
  }

  // Add price filter using $or with priceRanges
  if (priceRanges.length > 0) {
    query.$or = priceRanges.map(({ min, max }) => {
      return { price: { $gte: min, $lte: max } };
    });
  }
  console.log("Query : ", query);
  // Get total count of matching products for pagination info
  const total = await Product.countDocuments(query);

  // Fetch paginated filtered products
  const products = await Product.find(query)
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({
    total,
    page,
    limit,
    products,
  });
};

module.exports = { uploadCSV, getProducts };
