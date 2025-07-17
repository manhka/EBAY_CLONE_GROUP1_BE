const Order = require("../models/Order");
const OrderItem = require("../models/OrderItem");
const ShippingInfo = require("../models/ShippingInfo");
const Product = require("../models/Product");
const Address = require("../models/Address");
const Category = require("../models/Category");
const ReturnRequest = require("../models/ReturnRequest");

// Get order history with pagination and filtering
const getOrderHistory = async (userId, options = {}) => {
  try {
    const { page = 1, limit = 10, status } = options;
    const skip = (page - 1) * limit;

    // Build query filter
    const filter = { buyerId: userId };
    if (status) {
      filter.status = status;
    }

    // Get orders with pagination
    const orders = await Order.find(filter)
      .populate("addressId", "fullName street city state country")
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalOrders = await Order.countDocuments(filter);

    // Get order items count and return request status for each order
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const itemCount = await OrderItem.countDocuments({ orderId: order._id });
        
        // Check if there's a return request for this order
        const returnRequest = await ReturnRequest.findOne({ 
          orderId: order._id, 
          userId: userId 
        }).lean();
        
        let returnRequestStatus = null;
        if (returnRequest) {
          returnRequestStatus = {
            status: returnRequest.status,
            reason: returnRequest.reason,
            createdAt: returnRequest.createdAt,
            hasReturnRequest: true
          };
        } else {
          returnRequestStatus = {
            hasReturnRequest: false
          };
        }
        
        return {
          ...order,
          itemCount,
          returnRequest: returnRequestStatus,
        };
      })
    );

    return {
      orders: ordersWithItems,
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
      totalOrders,
      hasNext: page < Math.ceil(totalOrders / limit),
      hasPrev: page > 1,
    };
  } catch (error) {
    console.error("Error in getOrderHistory service:", error);
    throw new Error("Failed to retrieve order history");
  }
};

// Get detailed order information
const getOrderDetails = async (orderId, userId) => {
  try {
    // Find order and verify ownership
    const order = await Order.findOne({ _id: orderId, buyerId: userId })
      .populate("addressId")
      .lean();

    if (!order) {
      return null;
    }

    // Get order items with product details
    const orderItems = await OrderItem.find({ orderId })
      .populate({
        path: "productId",
        select: "title description price images categoryId",
        populate: {
          path: "categoryId",
          select: "name",
        },
      })
      .lean();

    // Get shipping information
    const shippingInfo = await ShippingInfo.findOne({ orderId }).lean();

    // Calculate totals
    const itemsTotal = orderItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    return {
      ...order,
      items: orderItems.map(item => ({
        ...item,
        product: item.productId // Map productId to product for frontend compatibility
      })),
      shippingInfo,
      itemsTotal,
    };
  } catch (error) {
    console.error("Error in getOrderDetails service:", error);
    throw new Error("Failed to retrieve order details");
  }
};

module.exports = {
  getOrderHistory,
  getOrderDetails,
}; 