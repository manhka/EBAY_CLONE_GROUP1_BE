const express = require("express");
const db = require("../models");
const router = express.Router();

// GET /api/categories -> Lấy tất cả categories
router.get("/", async (req, res) => {
  try {
    const categories = await db.Category.find();
    res.status(200).send(categories);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// GET /api/categories/:id/products -> Lấy các sản phẩm thuộc về một category ID
router.get("/:categoryId/products", async (req, res) => {
    const { categoryId } = req.params;
    try {
        const products = await db.Product.find({ categoryId }).populate("categoryId");
        res.status(200).json(products);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

module.exports = router;