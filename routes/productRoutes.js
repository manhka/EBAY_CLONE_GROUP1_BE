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

    const products = await db.Product.find().populate("categoryId");
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
    res.status(200).json(product);
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

module.exports = router;
