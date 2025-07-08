import Store from '../models/Store.js';
import Product from '../models/Product.js';

export const getStoreByProductId = async (req, res) => {
  try {
    const { productId } = req.params;
    // LOG 1: Kiểm tra xem có nhận được productId từ route không
    console.log(`[LOG 1] Nhận được yêu cầu cho productId: ${productId}`);

    if (!productId) {
      console.log("[LỖI] Không có productId trong request params.");
      return res.status(400).json({ message: 'Thiếu productId' });
    }

    // LOG 2: Bắt đầu tìm kiếm sản phẩm
    console.log('[LOG 2] Đang tìm kiếm sản phẩm trong database...');
    const product = await Product.findById(productId);

    if (!product) {
      // LOG 3A: Không tìm thấy sản phẩm
      console.log(`[LỖI 3A] Không tìm thấy sản phẩm với ID: ${productId}`);
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
    }

    // LOG 3B: Đã tìm thấy sản phẩm, ghi log dữ liệu sản phẩm
    console.log('[LOG 3B] Đã tìm thấy sản phẩm:', product);
    
    const sellerId = product.sellerId;

    if (!sellerId) {
      console.log(`[LỖI] Sản phẩm (ID: ${productId}) không có sellerId.`);
      return res.status(404).json({ message: 'Sản phẩm này không có thông tin người bán.' });
    }

    // LOG 4: Lấy được sellerId, bắt đầu tìm store
    console.log(`[LOG 4] Đang tìm cửa hàng với sellerId: ${sellerId}`);
    const store = await Store.findOne({ sellerId: sellerId });

    if (!store) {
      // LOG 5A: Không tìm thấy cửa hàng
      console.log(`[LỖI 5A] Không tìm thấy cửa hàng nào cho sellerId: ${sellerId}`);
      return res.status(404).json({ message: 'Không tìm thấy cửa hàng cho người bán này.' });
    }

    // LOG 5B: Đã tìm thấy cửa hàng, trả về kết quả
    console.log('[LOG 5B] Đã tìm thấy cửa hàng:', store);
    res.status(200).json(store);

  } catch (error) {
    console.error('[LỖI 6] Đã xảy ra lỗi server:', error);
    res.status(500).json({ message: 'Lỗi máy chủ', error: error.message });
  }
};