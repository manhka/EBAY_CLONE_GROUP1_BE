const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    description: String,
    status: String,
    resolution: String
});

module.exports = mongoose.model('Dispute', disputeSchema);
