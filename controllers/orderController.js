const orderService = require("../services/orderService");
const { validationResult } = require("express-validator");

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
  getOrderHistory,
  getOrderDetails,
}; 