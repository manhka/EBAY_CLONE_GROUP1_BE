const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const paymentSchema = new Schema({
  orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ["COD", "PayPal"], required: true },
  status: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
  paidAt: { type: Date },
  transactionId: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("Payment", paymentSchema);