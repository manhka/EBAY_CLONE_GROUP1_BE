const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Product title is required"],
      trim: true,
      minlength: [3, "Product title must be at least 3 characters long"],
      maxlength: [200, "Product title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
      minlength: [10, "Product description must be at least 10 characters long"],
      maxlength: [2000, "Product description cannot exceed 2000 characters"],
    },
    price: {
      type: Number,
      required: [true, "Product price is required"],
      min: [0, "Price cannot be negative"],
      validate: {
        validator: function(v) {
          return v >= 0;
        },
        message: "Price must be a positive number"
      }
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: function(v) {
          return v.length <= 10;
        },
        message: "Cannot have more than 10 images"
      }
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Category ID is required"],
      ref: "Category",
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Seller ID is required"],
      ref: "Store",
    },
    isAuction: {
      type: Boolean,
      default: false,
    },
    auctionEndTime: {
      type: Date,
      default: null,
      validate: {
        validator: function(v) {
          // If isAuction is true, auctionEndTime must be provided and in the future
          if (this.isAuction) {
            return v && v > new Date();
          }
          return true;
        },
        message: "Auction end time must be in the future for auction products"
      }
    }
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
productSchema.index({ categoryId: 1 });
productSchema.index({ sellerId: 1 });
productSchema.index({ status: 1 });
productSchema.index({ isAuction: 1, auctionEndTime: 1 });
productSchema.index({ title: "text", description: "text" });

// Pre-save middleware to validate auction logic
productSchema.pre("save", function(next) {
  if (this.isAuction && !this.auctionEndTime) {
    return next(new Error("Auction products must have an auction end time"));
  }
  if (!this.isAuction && this.auctionEndTime) {
    this.auctionEndTime = null;
  }
  next();
});

// Virtual for checking if auction is expired
productSchema.virtual("isAuctionExpired").get(function() {
  if (!this.isAuction || !this.auctionEndTime) return false;
  return new Date() > this.auctionEndTime;
});

// Method to increment views
productSchema.methods.incrementViews = function() {
  this.views = this.views + 1;
  return this.save();
};

const Product = mongoose.model("Product", productSchema);

module.exports = Product; 