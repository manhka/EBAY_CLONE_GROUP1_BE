const express = require("express");
const db = require("../models");
const router = express.Router();

// GET /api/products/search -> Để tìm kiếm, lọc, sắp xếp, phân trang
router.get("/search", async (req, res) => {
    try {
        const { query, category, sort, minPrice, maxPrice, page = 1, limit = 20 } = req.query;
        let filter = {};
        if (query) filter.title = { $regex: query, $options: "i" };
        if (category && category !== "0") filter.categoryId = category;
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = parseInt(minPrice) * 100;
            if (maxPrice) filter.price.$lte = parseInt(maxPrice) * 100;
        }
        let sortOptions = {};
        if (sort === 'price_asc') sortOptions.price = 1;
        if (sort === 'price_desc') sortOptions.price = -1;
        if (sort === 'newest') sortOptions.createdAt = -1;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const products = await db.Product.find(filter)
            .sort(sortOptions)
            .populate('categoryId')
            .limit(limitNum)
            .skip(skip);
        const totalResults = await db.Product.countDocuments(filter);
        res.status(200).json({
            products,
            currentPage: pageNum,
            totalPages: Math.ceil(totalResults / limitNum),
            totalResults
        });
    } catch (error) {
        console.error("Search API Error:", error);
        res.status(500).json({ message: "Server error during product search." });
    }
});

// GET /api/products/:id -> Lấy một sản phẩm theo ID
router.get("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const product = await db.Product.findById(id).populate("categoryId");
        if (!product) return res.status(404).json({ message: "Product not found" });

        const store = await db.Store.findOne({ sellerId: product.sellerId });
        res.status(200).json({ product: product.toObject(), store });
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

// GET /api/products -> Lấy tất cả sản phẩm (không lọc)
router.get("/", async (req, res) => {
    try {
        const products = await db.Product.find({}).populate("categoryId");
        res.status(200).send(products);
    } catch (error) {
        res.status(500).send({ message: error.message });
    }
});

module.exports = router;