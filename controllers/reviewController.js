const Review = require('../models/Review');
const Product = require('../models/Product');
const Feedback = require('../models/Feedback');
const mongoose = require('mongoose');

// Tạo đánh giá mới
exports.createReview = async (req, res) => {
  try {
    const { productId, reviewerId, rating, comment } = req.body;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ error: 'Invalid productId' });
    }

    const review = new Review({
      productId,
      reviewerId,
      rating,
      comment,
      createdAt: new Date()
    });
    await review.save();

    res.status(201).json({ message: 'Review created successfully', review });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Lấy tất cả review theo sản phẩm
exports.getReviewsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ error: 'Invalid productId' });
    }
    const reviews = await Review.find({ productId })
      .populate('reviewerId', 'name')
      .sort({ createdAt: -1 });

    // Tính trung bình rating
    const averageRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / (reviews.length || 1);

    res.json({
      reviews,
      averageRating: parseFloat(averageRating.toFixed(1)),
      totalReviews: reviews.length
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Xóa review
exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    await Review.findByIdAndDelete(id);
    res.json({ message: 'Review deleted' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
