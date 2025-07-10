const ReturnRequest = require("../models/ReturnRequest");
const Order = require("../models/Order");
const OrderItem = require("../models/OrderItem");

// Create a new return request
const createReturnRequest = async (data) => {
  try {
    const { orderId, userId, reason } = data;

    // Verify that the order exists and belongs to the user
    const order = await Order.findOne({ _id: orderId, buyerId: userId });
    if (!order) {
      return {
        success: false,
        message: "Order not found or you don't have permission to return this order",
      };
    }

    // Check if order status allows returns
    const allowedStatuses = ["delivered", "shipped"];
    if (!allowedStatuses.includes(order.status)) {
      const statusText = {
        pending: "chờ xử lý",
        confirmed: "đã xác nhận",
        cancelled: "đã hủy",
        refunded: "đã hoàn tiền"
      };
      
      return {
        success: false,
        message: `Không thể tạo yêu cầu hoàn trả cho đơn hàng có trạng thái: ${statusText[order.status] || order.status}. Chỉ có thể hoàn trả đơn hàng đã giao hoặc đang giao.`,
      };
    }

    // Check if a pending return request already exists for this order
    const existingRequest = await ReturnRequest.findOne({
      orderId,
      userId,
      status: { $in: ["pending", "approved", "processed"] },
    });

    if (existingRequest) {
      const statusText = {
        pending: "đang chờ xử lý",
        approved: "đã được chấp nhận",
        processed: "đang được xử lý"
      };
      
      return {
        success: false,
        message: `Đơn hàng này đã có yêu cầu hoàn trả ${statusText[existingRequest.status] || existingRequest.status}. Vui lòng kiểm tra trạng thái yêu cầu hoàn trả của bạn.`,
      };
    }

    // Create the return request
    const returnRequest = new ReturnRequest({
      orderId,
      userId,
      reason,
      status: "pending",
    });

    await returnRequest.save();

    // Populate order details for response
    const populatedRequest = await ReturnRequest.findById(returnRequest._id)
      .populate({
        path: "orderId",
        select: "orderDate totalPrice status",
      })
      .lean();

    return {
      success: true,
      message: "Return request created successfully",
      data: populatedRequest,
    };
  } catch (error) {
    console.error("Error in createReturnRequest service:", error);
    throw new Error("Failed to create return request");
  }
};

// Get return requests for a user
const getUserReturnRequests = async (userId, options = {}) => {
  try {
    const { page = 1, limit = 10, status } = options;
    const skip = (page - 1) * limit;

    // Build query filter
    const filter = { userId };
    if (status) {
      filter.status = status;
    }

    // Get return requests with pagination
    const returnRequests = await ReturnRequest.find(filter)
      .populate({
        path: "orderId",
        select: "orderDate totalPrice status buyerId addressId",
        populate: {
          path: "addressId",
          select: "fullName street city state country",
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalRequests = await ReturnRequest.countDocuments(filter);

    // Get order items count for each return request
    const returnRequestsWithDetails = await Promise.all(
      returnRequests.map(async (request) => {
        const itemCount = await OrderItem.countDocuments({ 
          orderId: request.orderId._id 
        });
        
        return {
          ...request,
          itemCount,
          order: {
            ...request.orderId,
            shippingAddress: request.orderId.addressId,
          },
        };
      })
    );

    return {
      returnRequests: returnRequestsWithDetails,
      currentPage: page,
      totalPages: Math.ceil(totalRequests / limit),
      totalRequests,
      hasNext: page < Math.ceil(totalRequests / limit),
      hasPrev: page > 1,
    };
  } catch (error) {
    console.error("Error in getUserReturnRequests service:", error);
    throw new Error("Failed to retrieve return requests");
  }
};

// Get detailed return request information
const getReturnRequestDetails = async (requestId, userId) => {
  try {
    // Find return request and verify ownership
    const returnRequest = await ReturnRequest.findOne({
      _id: requestId,
      userId,
    })
      .populate({
        path: "orderId",
        populate: {
          path: "addressId",
          select: "fullName street city state country",
        },
      })
      .lean();

    if (!returnRequest) {
      return null;
    }

    // Get order items for the related order
    const orderItems = await OrderItem.find({
      orderId: returnRequest.orderId._id,
    })
      .populate({
        path: "productId",
        select: "title description price images",
      })
      .lean();

    return {
      returnRequest,
      orderItems,
    };
  } catch (error) {
    console.error("Error in getReturnRequestDetails service:", error);
    throw new Error("Failed to retrieve return request details");
  }
};

module.exports = {
  createReturnRequest,
  getUserReturnRequests,
  getReturnRequestDetails,
}; 