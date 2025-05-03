import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  brand: { type: String },
  category: { type: String, required: true },
  subCategory: { type: String },

  price: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  finalPrice: { type: Number }, // you can auto-calculate this with a pre-save hook
  stock: { type: Number, required: true },

  images: [{ type: String, required: true }],

  // Gift-specific
  occasions: [{ type: String }], // e.g. ["Birthday", "Anniversary"]
  isCustomizable: { type: Boolean, default: false },
  customizationFields: [{ type: String }], // e.g. ["name", "photo", "message"]
  giftWrapAvailable: { type: Boolean, default: false },
  giftMessageAllowed: { type: Boolean, default: false },

  // Ratings & Reviews
  ratings: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
  },
  reviews: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      rating: Number,
      comment: String,
      date: Date,
    },
  ],

  tags: [{ type: String }],
  isRecommended: { type: Boolean, default: false },
  totalSold: { type: Number, default: 0 },

  // Optional/Future fields
  deliveryTime: { type: String, default: null }, // e.g. "1-3 days", "Same day"
  bundleItems: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  limitedEdition: { type: Boolean, default: false },
  seasonalTag: { type: String, default: null },

  status: {
    type: String,
    enum: ["active", "out-of-stock", "hidden"],
    default: "active",
  },

  seller: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: { type: String },
  },

  meta: {
    title: { type: String },
    description: { type: String },
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Product", productSchema);
