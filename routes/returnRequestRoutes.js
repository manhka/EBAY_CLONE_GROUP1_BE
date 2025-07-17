const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");
const returnRequestController = require("../controllers/returnRequestController");
const verifyToken = require("../middlewares/verifyToken");

// Create a new return request
// POST /api/return-requests
router.post(
  "/",
  verifyToken,
  [
    body("orderId")
      .isMongoId()
      .withMessage("Invalid order ID format"),
    body("reason")
      .isLength({ min: 10, max: 500 })
      .withMessage("Return reason must be between 10 and 500 characters"),
  ],
  returnRequestController.createReturnRequest
);

// Get return requests for authenticated user
// GET /api/return-requests?page=1&limit=10&status=pending
router.get("/", verifyToken, returnRequestController.getUserReturnRequests);

// Get return request details by ID
// GET /api/return-requests/:requestId
router.get(
  "/:requestId",
  verifyToken,
  [
    param("requestId")
      .isMongoId()
      .withMessage("Invalid return request ID format"),
  ],
  returnRequestController.getReturnRequestDetails
);

module.exports = router; 