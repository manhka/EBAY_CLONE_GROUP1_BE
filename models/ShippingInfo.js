const mongoose = require('mongoose');

const shippingSchema = new mongoose.Schema({
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    carrier: String,
    trackingNumber: String,
    status: String,
    estimatedArrival: Date
});

module.exports = mongoose.model('ShippingInfo', shippingSchema);
