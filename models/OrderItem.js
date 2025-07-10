const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Order ID is required"],
      ref: "Order",
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Product ID is required"],
      ref: "Product",
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
    unitPrice: {
      type: Number,
      required: [true, "Unit price is required"],
      min: [0, "Unit price cannot be negative"],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
orderItemSchema.index({ orderId: 1 });
orderItemSchema.index({ productId: 1 });

const OrderItem = mongoose.model("OrderItem", orderItemSchema);

module.exports = OrderItem; 