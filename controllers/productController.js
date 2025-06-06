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

// Get products with filters, search, and pagination
const getProducts = async (req, res) => {
  try {
    let {
      search = req.query.query,
      category,
      brand,
      price,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 10,
    } = req.query;

    // Build query object
    const query = {};
    const conditions = [];

    // Search functionality
    if (search) {
      conditions.push({
        $or: [
          { title: new RegExp(search, "i") },
          { description: new RegExp(search, "i") },
          { brand: new RegExp(search, "i") },
          { category: new RegExp(search, "i") },
          { tags: new RegExp(search, "i") },
        ],
      });
    }

    // Convert category and brand to arrays if they are comma-separated strings
    if (typeof category === "string") {
      category = category.split(",").map((cat) => cat.trim());
    }
    if (typeof brand === "string") {
      brand = brand.split(",").map((b) => b.trim());
    }

    // Category filter
    if (category && category.length > 0) {
      conditions.push({
        category: { $in: category.map((cat) => new RegExp(cat, "i")) },
      });
    }

    // Brand filter
    if (brand && brand.length > 0) {
      conditions.push({
        brand: { $in: brand.map((b) => new RegExp(b, "i")) },
      });
    }

    // Parse price ranges (format: "100-200,300-400" or "100-200")
    if (price) {
      let priceRanges = [];

      if (typeof price === "string") {
        priceRanges = price.split(",").map((range) => {
          const [min, max] = range.split("-").map(Number);
          return { min, max };
        });
      } else if (Array.isArray(price)) {
        priceRanges = price.map((range) => {
          const [min, max] = range.split("-").map(Number);
          return { min, max };
        });
      }

      if (priceRanges.length > 0) {
        conditions.push({
          $or: priceRanges.map(({ min, max }) => ({
            price: {
              $gte: min,
              $lte: max,
            },
          })),
        });
      }
    }

    // Combine all conditions with AND
    if (conditions.length > 0) {
      query.$and = conditions;
    }

    // Calculate pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Prepare sort object
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Execute query with pagination and sorting
    const products = await Product.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit))
      .select("title images price category brand stock ratings");

    // Get total count for pagination
    const total = await Product.countDocuments(query);

    res.status(200).json({
      status: 1,
      data: {
        products,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit)),
          limit: Number(limit),
        },
        appliedFilters: {
          search,
          category,
          brand,
          price,
          sortBy,
          sortOrder,
        },
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 0,
      message: "Error fetching products",
    });
  }
};

// Search ahead with similar products suggestion
const searchAhead = async (req, res) => {
  try {
    const { query, limit = 5 } = req.query;

    if (!query) {
      return res.status(200).json({
        status: 1,
        data: {
          suggestions: [],
          similar: [],
        },
      });
    }

    // Create a case-insensitive regex pattern
    const searchPattern = new RegExp(query, "i");

    // Get direct matches first (for autocomplete suggestions)
    const suggestions = await Product.find({
      $or: [
        { title: searchPattern },
        { category: searchPattern },
        { tags: searchPattern },
      ],
    })
      .select("title") // Only select title field
      .limit(Number(limit));

    // Get similar products using more flexible matching
    const similar = await Product.find({
      $and: [
        // Exclude exact matches we already have
        { _id: { $nin: suggestions.map((s) => s._id) } },
        {
          $or: [
            // Partial word matches in title
            { title: new RegExp(query.split(" ").join("|"), "i") },
            // Same category as matched products
            { category: { $in: suggestions.map((s) => s.category) } },
          ],
        },
      ],
    })
      .select("title") // Only select title field
      .limit(Number(limit));

    res.status(200).json({
      status: 1,
      data: {
        suggestions: suggestions.map((item) => ({
          _id: item._id,
          title: item.title,
          type: "suggestion",
        })),
        similar: similar.map((item) => ({
          _id: item._id,
          title: item.title,
          type: "similar",
        })),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 0,
      message: "Error performing search",
    });
  }
};

module.exports = {
  uploadCSV,
  getProducts,
  searchAhead,
};
