const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    averageRating: Number,
    totalReviews: Number,
    positiveRate: Number
});

module.exports = mongoose.model('Feedback', feedbackSchema);
