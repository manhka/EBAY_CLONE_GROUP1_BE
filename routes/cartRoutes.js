const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/authMiddleware');
const cartController = require('../controllers/cartController');

router.get('/', auth, cartController.getCart);
router.post('/items', auth, cartController.addToCart);
router.put('/items/:productId', auth, cartController.updateCartItem);
router.delete('/items/:productId', auth, cartController.removeFromCart);
router.delete('/', auth, cartController.clearCart);
router.post('/merge', auth, cartController.mergeCarts);
router.get('/count', auth, cartController.getCartItemCount);

module.exports = router;