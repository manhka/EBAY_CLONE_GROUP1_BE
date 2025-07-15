
const express = require('express');
const router = express.Router();
const { auth} = require('../middlewares/authMiddleware');
const csrfProtection = require('../middlewares/csrfProtection');
const reviewController = require('../controllers/reviewController');
router.post('/', auth, csrfProtection, reviewController.createReview);
router.get('/product/:productId', reviewController.getReviewsByProduct);
router.delete('/:id', auth, csrfProtection, reviewController.deleteReview);

module.exports = router;
