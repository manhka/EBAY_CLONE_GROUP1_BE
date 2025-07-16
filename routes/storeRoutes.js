const express = require("express");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const Store = require("../models/Store");

const router = express.Router();

router.get('/by-product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ message: 'Product ID không hợp lệ.' });
    }
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
    }
    if (!product.sellerId) {
      return res.status(404).json({ message: 'Sản phẩm này không có thông tin người bán.' });
    }
    const store = await Store.findOne({ sellerId: product.sellerId });
    if (!store) {
      return res.status(200).json(null);
    }
    res.status(200).json(store);
  } catch (error) {
    console.error("Lỗi trong storeRoutes (get by product):", error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

module.exports = router;