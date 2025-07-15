const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Coupon = require("../models/Coupon");
const { auth } = require("../middlewares/authMiddleware"); // Import middleware

// Lấy thông báo đơn hàng + khuyến mãi
router.get("/activity", auth, async (req, res) => {
  const userId = req.userId; // Sửa ở đây (không phải req.user._id)
  try {
    const [orders, coupons] = await Promise.all([
      Order.find({ buyerId: userId }).sort({ updatedAt: -1 }).limit(10),
      Coupon.find({
        endDate: { $gte: new Date() }
      }).sort({ createdAt: -1 }).limit(10)
    ]);

    const merged = [
      ...orders.map(o => ({
        type: "order",
        title: `Đơn hàng #${o._id.toString().slice(-5)}`,
        message: `Trạng thái hiện tại: ${o.status}`,
        date: o.updatedAt,
        data: { orderId: o._id },
      })),
      ...coupons.map(c => ({
        type: "promotion",
        title: `Mã giảm giá ${c.code}`,
        message: `Giảm ${c.discountPercent}% đến ${new Date(c.endDate).toLocaleDateString()}`,
        date: c.createdAt,
        data: { couponCode: c.code },
      })),
    ];

    const sorted = merged.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(sorted.slice(0, 20));
  } catch (err) {
    console.error("Activity API error:", err);
    res.status(500).json({ message: "Lỗi khi lấy thông báo." });
  }
});

module.exports = router;
