const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      minlength: [2, "Category name must be at least 2 characters long"],
      maxlength: [100, "Category name cannot exceed 100 characters"],
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster search - REMOVED: duplicate with unique: true constraint
// categorySchema.index({ name: 1 });

const Category = mongoose.model("Category", categorySchema);

module.exports = Category; 