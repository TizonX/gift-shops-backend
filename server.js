const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors"); // Optional: for enabling cross-origin requests
const path = require("path");
const connectDB = require("./config/db");
const authRoute = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");
const cookieParser = require("cookie-parser");
const corsOptions = require("./config/corsConfig");
dotenv.config(); // Load environment variables from .env

const app = express();
app.use(express.json()); // For parsing JSON request bodies
app.use(cors(corsOptions)); // Optional: if you want to enable cross-origin requests
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// Serve static files (images) from the 'uploads' directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/v1/auth", authRoute);
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/users", userRoutes);
// products images upload
app.use("/api/v1/category/products", productRoutes);

// Define the port your server will listen on
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
