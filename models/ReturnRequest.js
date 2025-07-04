const mongoose = require('mongoose');

const returnRequestSchema = new mongoose.Schema({
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: String,
    status: String,
    createdAt: Date
});

module.exports = mongoose.model('ReturnRequest', returnRequestSchema);
