const express = require("express");
const router = express.Router();
const db = require("../models");
const paypal = require("@paypal/checkout-server-sdk");
const mongoose = require("mongoose");
require("dotenv").config();
const UserInformation = require("../models/UserInformation");
const ObjectId = mongoose.Types.ObjectId;
const { param } = require("express-validator");
const orderController = require("../controllers/orderController");
const verifyToken = require("../middlewares/verifyToken");

// PayPal SDK config
const environment = new paypal.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID,
  process.env.PAYPAL_CLIENT_SECRET
);
const paypalClient = new paypal.core.PayPalHttpClient(environment);

// Get order history for authenticated user
// GET /api/orders?page=1&limit=10&status=delivered
router.get("/", verifyToken, orderController.getOrderHistory);

// Get order details by ID
// GET /api/orders/:orderId
router.get(
  "/:orderId",
  verifyToken,
  [
    param("orderId")
      .isMongoId()
      .withMessage("Invalid order ID format"),
  ],
  orderController.getOrderDetails
);

// Tạo PayPal Order
router.post("/create", async (req, res) => {
  const { buyerId, addressId, items } = req.body;

  console.log("📦 Tạo PayPal order với payload:", { buyerId, addressId, items });

  try {
    if (!buyerId || !addressId || !Array.isArray(items) || items.length === 0) {
      throw new Error("Thiếu thông tin đặt hàng");
    }

    const buyerObjectId = new ObjectId(buyerId);
    const addressObjectId = new ObjectId(addressId);

    if (!buyerObjectId || !addressObjectId) {
      throw new Error("ID người mua hoặc địa chỉ không hợp lệ");
    }

    const address = await UserInformation.findOne({
      _id: addressObjectId,
      user: buyerObjectId,
    });

    if (!address) throw new Error("Không tìm thấy địa chỉ của người dùng");

    // Tính tổng giá trị đơn hàng
    let totalAmount = 0;
    const productDetails = [];

    for (const item of items) {
      const product = await db.Product.findById(item.productId);
      if (!product) throw new Error(`Sản phẩm với ID ${item.productId} không tồn tại`);
      totalAmount += product.price * item.quantity;
      productDetails.push({ product, quantity: item.quantity });
    }

    // Tạo PayPal Order
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");
    request.requestBody({
      intent: "CAPTURE",
      application_context: {
        return_url: "http://localhost:3000/api/orders/success",
        cancel_url: "http://localhost:3000/checkout",
      },
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: (totalAmount / 100).toFixed(2),
          },
        },
      ],
    });

    const paypalOrder = await paypalClient.execute(request);
    const paypalOrderId = paypalOrder.result.id;
    const approvalUrl = paypalOrder.result.links.find((l) => l.rel === "approve")?.href;

    if (!paypalOrderId || !approvalUrl) {
      throw new Error("Không nhận được PayPal order ID hoặc approvalUrl");
    }

    // Lưu đơn hàng vào DB
    const newOrder = await db.Order.create({
      buyerId: buyerObjectId,
      addressId: addressObjectId,
      status: "shipping",
      totalPrice: totalAmount,
      paypalOrderId,
    });

    // Lưu OrderItems
    const orderItems = productDetails.map(({ product, quantity }) => ({
      orderId: newOrder._id,
      productId: product._id,
      quantity,
      unitPrice: product.price,
    }));

    await db.OrderItem.insertMany(orderItems);

    return res.status(200).json({
      message: "Đã tạo PayPal order thành công",
      paypal_order_id: paypalOrderId,
      approvalUrl,
      order_id: newOrder._id,
    });

  } catch (err) {
    console.error("🔥 Lỗi khi tạo PayPal order:", {
      message: err.message,
      stack: err.stack,
    });
    return res.status(500).json({ message: err.message });
  }
});

router.get("/detail/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({ message: "Thiếu orderId" });
    }

    const order = await db.Order.findById(orderId)
      .populate({
        path: "addressId",
        model: "UserInformation",
      })
      .populate("buyerId", "email")
      .lean();

    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    const orderItems = await db.OrderItem.find({ orderId }).populate("productId").lean();

    const formattedItems = orderItems.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
    }));

    return res.json({
      order,
      items: formattedItems,
      address: order.addressId,
    });
  } catch (error) {
    console.error("❌ Lỗi khi lấy chi tiết đơn hàng:", error);
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

router.get("/status/:orderId", async (req, res) => {
  try {
    const order = await db.Order.findById(new mongoose.Types.ObjectId(req.params.orderId))
      .select("status orderDate");
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Hủy đơn hàng
router.patch("/:id/cancel", async (req, res) => {
  try {
    const order = await db.Order.findById(new mongoose.Types.ObjectId(req.params.id));
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }

    if (order.status === "completed" || order.status === "cancelled") {
      return res.status(400).json({ message: "Không thể hủy đơn hàng này" });
    }

    order.status = "cancelled";
    await order.save();

    res.status(200).json({ message: "Đã hủy đơn hàng thành công", status: order.status });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/:orderId/return-request", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { userId, reason } = req.body;

    // Kiểm tra order tồn tại
    const order = await db.Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
    }
    if (order.status !== "completed") {
      return res.status(400).json({ message: "Đơn hàng không đủ điều kiện để hoàn trả" });
    }
    // Tạo return request
    const returnRequest = new db.ReturnRequest({
      orderId,
      userId,
      reason,
      status: "pending",
      createdAt: new Date()
    });

    await returnRequest.save();

    // Cập nhật trạng thái đơn hàng
    order.status = "return_requested";
    await order.save();

    res.status(201).json({
      message: "Tạo yêu cầu hoàn trả thành công",
      returnRequest
    });
  } catch (error) {
    console.error("Lỗi khi tạo yêu cầu hoàn trả:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
});

// Capture PayPal Order & Lưu vào DB
router.get("/success", async (req, res) => {
  const { token, PayerID } = req.query;

  if (!token || !PayerID) {
    return res.status(400).json({ message: "Thiếu thông tin PayPal" });
  }

  try {
    console.log("PayPal Token:", token);

    const order = await db.Order.findOne({ paypalOrderId: token });
    if (!order) throw new Error("Không tìm thấy đơn hàng tương ứng");

    if (order.status !== "shipping") {
      throw new Error("Đơn hàng đã được xử lý hoặc có trạng thái không hợp lệ");
    }

    const orderItems = await db.OrderItem.find({ orderId: order._id })
      .populate("productId", "title price images");

    if (!orderItems || orderItems.length === 0) {
      throw new Error("Không tìm thấy sản phẩm nào trong đơn hàng");
    }

    console.log("Fetched OrderItems:", orderItems);

    for (const item of orderItems) {
      const product = await db.Product.findById(item.productId);
      if (!product) {
        throw new Error(`Không tìm thấy sản phẩm ID ${item.productId}`);
      }

      if (product.quantity < item.quantity) {
        throw new Error(
          `Không đủ hàng cho sản phẩm "${product.title}". Tồn kho: ${product.quantity}, cần: ${item.quantity}`
        );
      }

      product.quantity -= item.quantity;
      await product.save();
    }

    order.status = "completed";
    order.paymentDate = new Date();
    await order.save();
    await db.Cart.updateOne({ userId: order.buyerId }, { $set: { items: [] } });
    const frontendSuccessUrl = `http://localhost:3001/success?orderId=${order._id}`;
    return res.redirect(frontendSuccessUrl);
  } catch (error) {
    console.error("❌ SUCCESS ORDER ERROR:", error);

    const frontendErrorUrl = `http://localhost:3001/checkout?error=${encodeURIComponent(error.message)}`;
    return res.redirect(
      `${frontendErrorUrl}?paypal_error=1`
    );
  }
});

// orderRoutes.js
router.post("/success", async (req, res) => {
  const { token, PayerID } = req.body;

  if (!token || !PayerID) {
    return res.status(400).json({ message: "Thiếu thông tin PayPal" });
  }

  try {
    console.log("PayPal Token:", token);

    const order = await db.Order.findOne({ paypalOrderId: token });
    if (!order) throw new Error("Không tìm thấy đơn hàng tương ứng");

    if (order.status !== "shipping") {
      throw new Error("Đơn hàng đã được xử lý hoặc có trạng thái không hợp lệ");
    }

    const orderItems = await db.OrderItem.find({ orderId: order._id })
      .populate("productId", "title price images");

    if (!orderItems || orderItems.length === 0) {
      throw new Error("Không tìm thấy sản phẩm nào trong đơn hàng");
    }

    for (const item of orderItems) {
      const product = await db.Product.findById(item.productId);
      if (!product) {
        throw new Error(`Không tìm thấy sản phẩm ID ${item.productId}`);
      }

      if (product.quantity < item.quantity) {
        throw new Error(
          `Không đủ hàng cho sản phẩm "${product.title}". Tồn kho: ${product.quantity}, cần: ${item.quantity}`
        );
      }

      product.quantity -= item.quantity;
      await product.save();
    }

    order.status = "completed";
    order.paymentDate = new Date();
    await order.save();

    return res.status(200).json({ message: "Đã hoàn tất thanh toán", orderId: order._id });
  } catch (error) {
    console.error("❌ ERROR capturing PayPal order:", error);
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
