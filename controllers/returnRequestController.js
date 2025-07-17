const returnRequestService = require("../services/returnRequestService");
const { validationResult } = require("express-validator");

// Create a new return request
const createReturnRequest = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Validation failed",
        errors: errors.array(),
      });
    }

    const userId = req.user._id;
    const { orderId, reason } = req.body;

    const result = await returnRequestService.createReturnRequest({
      orderId,
      userId,
      reason,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        msg: result.message,
      });
    }

    return res.status(201).json({
      success: true,
      msg: "Return request created successfully",
      data: result.data,
    });
  } catch (error) {
    console.error("Error creating return request:", error);
    return res.status(500).json({
      success: false,
      msg: "Failed to create return request",
      error: error.message,
    });
  }
};

// Get return requests for authenticated user
const getUserReturnRequests = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, status } = req.query;

    const result = await returnRequestService.getUserReturnRequests(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
    });

    return res.status(200).json({
      success: true,
      msg: "Return requests retrieved successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error getting return requests:", error);
    return res.status(500).json({
      success: false,
      msg: "Failed to retrieve return requests",
      error: error.message,
    });
  }
};

// Get return request details
const getReturnRequestDetails = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        msg: "Validation failed",
        errors: errors.array(),
      });
    }

    const { requestId } = req.params;
    const userId = req.user._id;

    const returnRequest = await returnRequestService.getReturnRequestDetails(
      requestId,
      userId
    );

    if (!returnRequest) {
      return res.status(404).json({
        success: false,
        msg: "Return request not found or you don't have permission to view this request",
      });
    }

    return res.status(200).json({
      success: true,
      msg: "Return request details retrieved successfully",
      data: returnRequest,
    });
  } catch (error) {
    console.error("Error getting return request details:", error);
    return res.status(500).json({
      success: false,
      msg: "Failed to retrieve return request details",
      error: error.message,
    });
  }
};

module.exports = {
  createReturnRequest,
  getUserReturnRequests,
  getReturnRequestDetails,
}; 