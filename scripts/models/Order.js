const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Buyer ID is required"],
      ref: "User",
    },
    addressId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, "Address ID is required"],
      ref: "Address",
    },
    orderDate: {
      type: Date,
      default: Date.now,
      required: [true, "Order date is required"],
    },
    totalPrice: {
      type: Number,
      required: [true, "Total price is required"],
      min: [0, "Total price cannot be negative"],
    },
    status: {
      type: String,
      required: [true, "Order status is required"],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
orderSchema.index({ buyerId: 1 });
orderSchema.index({ addressId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ orderDate: -1 });

const Order = mongoose.model("Order", orderSchema);

module.exports = Order; 