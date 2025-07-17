const mongoose = require("mongoose");

const returnRequestSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Order ID is required"],
      ref: "Order",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "User ID is required"],
      ref: "User",
    },
    reason: {
      type: String,
      required: [true, "Return reason is required"],
      trim: true,
      minlength: [10, "Return reason must be at least 10 characters long"],
      maxlength: [500, "Return reason cannot exceed 500 characters"],
    },
    status: {
      type: String,
      required: [true, "Return request status is required"],
      enum: ["pending", "approved", "rejected", "processed", "completed"],
      default: "pending",
    },
    createdAt: {
      type: Date,
      default: Date.now,
      required: [true, "Created date is required"],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
returnRequestSchema.index({ orderId: 1 });
returnRequestSchema.index({ userId: 1 });
returnRequestSchema.index({ status: 1 });
returnRequestSchema.index({ createdAt: -1 });

const ReturnRequest = mongoose.model("ReturnRequest", returnRequestSchema);

module.exports = ReturnRequest; 