const express = require("express");
const db = require("../models");

const router = express.Router();

// Định nghĩa route và viết logic xử lý ngay tại đây
router.get('/product/:id', async (req, res) => {
  try {
    const { productId } = req.params;

    // Kiểm tra xem productId có hợp lệ không (tùy chọn)
    if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ message: 'Product ID không hợp lệ.' });
    }

    // 1. Tìm sản phẩm dựa trên productId để lấy sellerId
    const product = await db.Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
    }

    // 2. Dùng sellerId từ sản phẩm để tìm thông tin cửa hàng
    const store = await db.Store.findOne({ sellerId: product.sellerId });
    
    if (!store) {
      return res.status(404).json({ message: 'Không tìm thấy cửa hàng cho người bán này.' });
    }

    // 3. Trả về thông tin cửa hàng nếu tìm thấy
    res.status(200).json(store);

  } catch (error) {
    console.error("Lỗi trong storeRoutes:", error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

module.exports = router;