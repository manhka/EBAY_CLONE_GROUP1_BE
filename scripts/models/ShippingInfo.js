const mongoose = require("mongoose");

const shippingInfoSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Order ID is required"],
      ref: "Order",
    },
    carrier: {
      type: String,
      required: [true, "Carrier is required"],
      trim: true,
      maxlength: [100, "Carrier name cannot exceed 100 characters"],
    },
    trackingNumber: {
      type: String,
      required: [true, "Tracking number is required"],
      trim: true,
      maxlength: [100, "Tracking number cannot exceed 100 characters"],
    },
    status: {
      type: String,
      required: [true, "Shipping status is required"],
      trim: true,
      maxlength: [50, "Status cannot exceed 50 characters"],
    },
    estimatedArrival: {
      type: Date,
      required: [true, "Estimated arrival date is required"],
    },
  },
  {
    timestamps: true,
  }
);

// Index for better performance
shippingInfoSchema.index({ orderId: 1 });

const ShippingInfo = mongoose.model("ShippingInfo", shippingInfoSchema);

module.exports = ShippingInfo; 