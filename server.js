const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors"); // Optional: for enabling cross-origin requests
const connectDB = require("./config/db");
const authRoute = require("./routes/authRoutes");
const cookieParser = require("cookie-parser");
app.use(cookieParser());
dotenv.config(); // Load environment variables from .env

const app = express();
app.use(express.json()); // For parsing JSON request bodies
app.use(cors()); // Optional: if you want to enable cross-origin requests

// Connect to MongoDB
connectDB();

app.use("/api/v1/auth", authRoute);

// Define the port your server will listen on
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
