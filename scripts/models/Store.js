const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Seller ID is required"],
      ref: "User",
      unique: true, // Mỗi seller chỉ có 1 store
    },
    storeName: {
      type: String,
      required: [true, "Store name is required"],
      trim: true,
      minlength: [2, "Store name must be at least 2 characters long"],
      maxlength: [100, "Store name cannot exceed 100 characters"],
      unique: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
      default: "",
    },
    bannerImageURL: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster search - REMOVED: duplicates with unique: true constraints
// storeSchema.index({ sellerId: 1 });
// storeSchema.index({ storeName: 1 });

const Store = mongoose.model("Store", storeSchema);

module.exports = Store; 