const express = require("express");
const router = express.Router();
const { param } = require("express-validator");
const orderController = require("../controllers/orderController");
const verifyToken = require("../middlewares/verifyToken");

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

module.exports = router; 