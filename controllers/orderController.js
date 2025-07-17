const { Order, OrderItem, Product, Coupon, Address, Payment } = require("../models");
const mongoose = require("mongoose");
const orderService = require("../services/orderService");
const { validationResult } = require("express-validator");

// @desc    Tạo đơn hàng mới (xử lý checkout)
// @route   POST /api/orders
exports.createOrder = async (req, res) => {
  const { items, addressId, paymentMethod, couponCode } = req.body;
  // `items` sẽ là một mảng: [{ productId: '...', quantity: 2 }, ...]

  if (!items || items.length === 0) {
    return res.status(400).json({ msg: "Giỏ hàng không được để trống." });
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // 1. Kiểm tra thông tin đầu vào
    const shippingAddress = await Address.findOne({ _id: addressId, userId: req.user.id }).session(session);
    if (!shippingAddress) {
      throw new Error("Địa chỉ giao hàng không hợp lệ.");
    }

    const productIds = items.map(item => item.productId);
    const productsInDb = await Product.find({ _id: { $in: productIds } }).session(session);
    if (productsInDb.length !== productIds.length) {
      throw new Error("Một hoặc nhiều sản phẩm không tồn tại.");
    }

    // 2. Tính toán giá trị đơn hàng
    let subTotal = 0;
    for (const item of items) {
      const product = productsInDb.find(p => p._id.toString() === item.productId);
      subTotal += product.price * item.quantity;
    }

    let discount = 0;
    let appliedCoupon = null;
    if (couponCode) {
      appliedCoupon = await Coupon.findOne({
        code: couponCode,
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
      }).session(session);

      if (!appliedCoupon || appliedCoupon.currentUsage >= appliedCoupon.maxUsage) {
        throw new Error("Mã giảm giá không hợp lệ hoặc đã hết lượt sử dụng.");
      }
      discount = (subTotal * appliedCoupon.discountPercent) / 100;
    }

    const totalPrice = subTotal - discount;

    // 3. Tạo Order
    const order = new Order({
      buyerId: req.user.id,
      addressId: shippingAddress._id,
      totalPrice: totalPrice,
      status: "pending",
      appliedCouponCode: couponCode || null,
    });
    await order.save({ session });
    
    // 4. Tạo OrderItems
    const orderItemsToCreate = items.map(item => {
        const product = productsInDb.find(p => p._id.toString() === item.productId);
        return {
            orderId: order._id,
            productId: product._id,
            quantity: item.quantity,
            unitPrice: product.price
        };
    });
    console.log("🧾 OrderItems sẽ tạo:", orderItemsToCreate);

    await OrderItem.insertMany(orderItemsToCreate, { session });
    
    // 5. Tạo Payment
    const payment = new Payment({
      orderId: order._id,
      userId: req.user.id,
      amount: totalPrice,
      method: paymentMethod,
      status: "pending",
    });
    await payment.save({ session });
    
    order.paymentId = payment._id;

    // 6. Xử lý thanh toán và cập nhật trạng thái
    if (paymentMethod === "COD") {
      payment.status = "completed"; // Coi như thành công khi đặt hàng
      payment.paidAt = new Date();
      order.status = "processing";
    } else if (paymentMethod === "PayPal") {
      // Giả lập thành công
      payment.status = "completed";
      payment.paidAt = new Date();
      payment.transactionId = `PAYPAL_SIM_${Date.now()}`;
      order.status = "processing";
    }

    await order.save({ session });
    await payment.save({ session });

    // Cập nhật lượt sử dụng coupon
    if (appliedCoupon) {
        appliedCoupon.currentUsage += 1;
        await appliedCoupon.save({ session });
    }

    await session.commitTransaction();
    res.status(201).json({ msg: "Đặt hàng thành công!", order });

  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ msg: "Tạo đơn hàng thất bại", error: error.message });
  } finally {
    session.endSession();
  }
};

// Get order history for authenticated user
const getOrderHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, status } = req.query;

    const result = await orderService.getOrderHistory(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
    });

    return res.status(200).json({
      success: true,
      msg: "Order history retrieved successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error getting order history:", error);
    return res.status(500).json({
      success: false,
      msg: "Failed to retrieve order history",
      error: error.message,
    });
  }
};

// Get order details by ID
const getOrderDetails = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Validation failed",
        errors: errors.array(),
      });
    }

    const { orderId } = req.params;
    const userId = req.user._id;

    const orderDetails = await orderService.getOrderDetails(orderId, userId);

    if (!orderDetails) {
      return res.status(404).json({
        success: false,
        msg: "Order not found or you don't have permission to view this order",
      });
    }

    return res.status(200).json({
      success: true,
      msg: "Order details retrieved successfully",
      data: orderDetails,
    });
  } catch (error) {
    console.error("Error getting order details:", error);
    return res.status(500).json({
      success: false,
      msg: "Failed to retrieve order details",
      error: error.message,
    });
  }
};

module.exports = {
  createOrder: exports.createOrder,
  getOrderHistory,
  getOrderDetails,
};
