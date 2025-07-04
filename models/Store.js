const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema({
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    storeName: String,
    description: String,
    bannerImageURL: String
});

module.exports = mongoose.model('Store', storeSchema);
