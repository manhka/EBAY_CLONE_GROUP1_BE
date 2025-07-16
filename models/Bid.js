const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    bidderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: Number,
    bidTime: Date
});

module.exports = mongoose.model('Bid', bidSchema);
