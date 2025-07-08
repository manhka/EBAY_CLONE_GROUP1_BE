const express = require("express");
const db = require("../models");

const router = express.Router();


router.get("/products", async (req, res) => {
  try {
    if (req.query.id) {
      const product = await db.Product.findById(req.query.id).populate(
        "categoryId"
      );
      if (!product) {
        return res.status(404).send({ message: "Product not found" });
      }
      return res.status(200).send([product]);
    }

    const products = await db.Product.find({}).populate("categoryId");
    res.status(200).send(products);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

router.get("/product/category/name/:name", async (req, res) => {
  const { name } = req.params;
  try {
    const category = await db.Category.findOne({ name });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    const products = await db.Product.find({
      categoryId: category._id,
    }).populate("categoryId");
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all categories
router.get("/categories", async (req, res) => {
  try {
    const categories = await db.Category.find();
    res.status(200).send(categories);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

router.get("/product/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const product = await db.Product.findById(id).populate("categoryId");
    if (!product) return res.status(404).json({ message: "Product not found" });
    const store = await db.Store.findOne({ sellerId: product.sellerId });
    const productObject = product.toObject();
    res.status(200).json({
      product: productObject,
      store: store,
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

router.get("/product/category/:categoryId", async (req, res) => {
  const { categoryId } = req.params;
  try {
    const products = await db.Product.find({ categoryId }).populate(
      "categoryId"
    );
    res.status(200).json(products);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});


// BE: routes/productRoutes.js

router.get("/products/search", async (req, res) => {
  try {
    // Lấy các tham số từ query string
    const { query, category, sort, minPrice, maxPrice, page = 1, limit = 20 } = req.query;

    let filter = {};

    // 1. Lọc theo tên sản phẩm (query)
    if (query) {
      filter.title = { $regex: query, $options: "i" };
    }
    // 2. Lọc theo danh mục (category)
    if (category && category !== "0") {
      filter.categoryId = category;
    }
    // 3. Lọc theo giá (price)
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseInt(minPrice) * 100;
      if (maxPrice) filter.price.$lte = parseInt(maxPrice) * 100;
    }

    // Xây dựng phương thức sắp xếp
    let sortOptions = {};
    if (sort === 'lowToHigh') sortOptions.price = 1;
    if (sort === 'highToLow') sortOptions.price = -1;

    // 4. Phân trang
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Thực hiện truy vấn và đếm tổng số kết quả
    const products = await db.Product.find(filter)
      .sort(sortOptions)
      .populate('categoryId')
      .limit(limitNum)
      .skip(skip);

    const totalResults = await db.Product.countDocuments(filter);

    // Trả về dữ liệu kèm thông tin phân trang
    res.status(200).json({
      products,
      currentPage: pageNum,
      totalPages: Math.ceil(totalResults / limitNum),
      totalResults
    });

  } catch (error) {
    console.error("!!! SEARCH API CRASHED:", error);
    res.status(500).json({ message: "An unexpected error occurred on the server." });
  }
});

module.exports = router;
