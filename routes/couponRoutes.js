const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Coupon = require('../models/Coupon.js');

// Tạo mã giảm giá mới
router.post('/create', async (req, res) => {
    try {
        const {
            code,
            discountType,
            discountPercent,
            minPurchaseAmount,
            maxDiscountAmount,
            startDate,
            endDate,
            usageLimit
        } = req.body;

        // Kiểm tra mã đã tồn tại chưa
        const existingCoupon = await Coupon.findOne({ code });
        if (existingCoupon) {
            return res.status(400).json({ message: 'Mã giảm giá đã tồn tại' });
        }

        const coupon = new Coupon({
            code,
            discountType,
            discountPercent,
            minPurchaseAmount,
            maxDiscountAmount,
            startDate,
            endDate,
            usageLimit
        });

        await coupon.save();
        res.status(201).json({ message: 'Tạo mã giảm giá thành công', coupon });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// Lấy danh sách mã giảm giá
router.get('/', async (req, res) => {
    try {
        const coupons = await Coupon.find().lean();
        res.json(coupons);
    } catch (error) {
        console.error('Lỗi khi lấy danh sách mã giảm giá:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// Lấy thông tin một mã giảm giá
router.get('/:code', async (req, res) => {
    try {
        const coupon = await Coupon.findOne({ code: req.params.code });
        if (!coupon) {
            return res.status(404).json({ message: 'Không tìm thấy mã giảm giá' });
        }
        res.json(coupon);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// Cập nhật mã giảm giá
router.put('/:id', async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!coupon) {
            return res.status(404).json({ message: 'Không tìm thấy mã giảm giá' });
        }
        res.json({ message: 'Cập nhật thành công', coupon });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// Xóa mã giảm giá
router.delete('/:id', async (req, res) => {
    try {
        const coupon = await Coupon.findByIdAndDelete(req.params.id);
        if (!coupon) {
            return res.status(404).json({ message: 'Không tìm thấy mã giảm giá' });
        }
        res.json({ message: 'Xóa mã giảm giá thành công' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// Kiểm tra và áp dụng mã giảm giá
router.post('/apply', async (req, res) => {
    try {
        const { code, productId } = req.body;

        if (!code || !productId) {
            return res.status(400).json({ message: 'Thiếu mã giảm giá hoặc ID sản phẩm.' });
        }

        const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

        if (!coupon) {
            return res.status(404).json({ message: 'Mã giảm giá không hợp lệ hoặc đã hết hạn.' });
        }

        // Đảm bảo startDate và endDate là kiểu Date
        const now = new Date();
        const startDate = new Date(coupon.startDate);
        const endDate = new Date(coupon.endDate);

        if (now < startDate || now > endDate) {
            return res.status(400).json({ message: 'Mã giảm giá không trong thời gian hiệu lực.' });
        }

        // Kiểm tra sản phẩm có được áp dụng không
        const applicableProducts = coupon.applicableProducts || [];
        const isApplicable =
            applicableProducts.length === 0 ||
            applicableProducts.map(id => id.toString()).includes(productId.toString());

        if (!isApplicable) {
            return res.status(400).json({ message: 'Mã giảm giá không áp dụng cho sản phẩm này.' });
        }

        // Trả về response rõ ràng
        return res.status(200).json({
            success: true,
            message: 'Áp dụng mã giảm giá thành công!',
            discount: coupon  
        });

    } catch (error) {
        console.error("Error in /coupons/validate:", error);
        return res.status(500).json({
            message: 'Lỗi server khi áp dụng mã giảm giá',
            error: error.message,
        });
    }
});


// Tìm mã giảm giá theo productId
router.get('/product/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const now = new Date();

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: 'Product ID không hợp lệ.' });
        }

        // Tìm các mã còn hạn, đang hoạt động và áp dụng cho sản phẩm này HOẶC cho tất cả sản phẩm
        const coupons = await Coupon.find({
            $or: [
                { applicableProducts: { $in: [productId] } }, // Áp dụng cho sản phẩm cụ thể
                { applicableProducts: { $size: 0 } }          // Hoặc áp dụng cho tất cả (mảng rỗng)
            ],
            startDate: { $lte: now },
            endDate: { $gte: now },
            isActive: true
        }).lean();

        // Luôn trả về 200, dù có mã hay không, để frontend dễ xử lý
        res.status(200).json(coupons);

    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi tìm mã giảm giá', error: error.message });
    }
});

module.exports = router;
