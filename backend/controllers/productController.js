import asyncHandler from "express-async-handler";
import Product from "../models/Product.js";
import { isValidObjectId, isNonEmptyString } from "../utils/validators.js";

const ALLOWED_TYPES = ["wall", "alarm", "luxury"];

/**
 * @desc    Get all products, with optional type/price filtering and sorting
 *          (mirrors the filtering the Shop page used to do entirely client-side)
 * @route   GET /api/products?type=wall,alarm&minPrice=0&maxPrice=100&sort=price_low
 * @access  Public
 */
export const getProducts = asyncHandler(async (req, res) => {
  const { type, minPrice, maxPrice, sort } = req.query;

  const filter = {};

  if (type) {
    const types = type
      .split(",")
      .map((t) => t.trim())
      .filter((t) => ALLOWED_TYPES.includes(t));
    if (types.length > 0) filter.type = { $in: types };
  }

  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice !== undefined && minPrice !== "") filter.price.$gte = Number(minPrice);
    if (maxPrice !== undefined && maxPrice !== "") filter.price.$lte = Number(maxPrice);
  }

  let sortOption = { createdAt: -1 }; // "newest" default
  if (sort === "price_low") sortOption = { price: 1 };
  if (sort === "price_high") sortOption = { price: -1 };

  const products = await Product.find(filter).sort(sortOption);

  res.status(200).json({ success: true, data: products });
});

/**
 * @desc    Get a single product by id
 * @route   GET /api/products/:id
 * @access  Public
 */
export const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400);
    throw new Error("Invalid product id");
  }

  const product = await Product.findById(id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  res.status(200).json({ success: true, data: product });
});

/**
 * @desc    Create a new product
 * @route   POST /api/products
 * @access  Private/Admin
 */
export const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    brand,
    type,
    price,
    originalPrice,
    stock,
    rating,
    description,
    image,
  } = req.body;

  if (
    !isNonEmptyString(name) ||
    !isNonEmptyString(brand) ||
    !isNonEmptyString(type) ||
    price === undefined ||
    price === null ||
    price === ""
  ) {
    res.status(400);
    throw new Error("Please fill all required fields (name, brand, type, price)");
  }

  if (!ALLOWED_TYPES.includes(type)) {
    res.status(400);
    throw new Error(`Type must be one of: ${ALLOWED_TYPES.join(", ")}`);
  }

  if (!isNonEmptyString(image)) {
    res.status(400);
    throw new Error("Please provide a product image");
  }

  if (Number.isNaN(Number(price)) || Number(price) < 0) {
    res.status(400);
    throw new Error("Price must be a valid non-negative number");
  }

  const product = await Product.create({
    name: name.trim(),
    brand: brand.trim(),
    type,
    price: Number(price),
    originalPrice:
      originalPrice !== undefined && originalPrice !== null && originalPrice !== ""
        ? Number(originalPrice)
        : null,
    stock: stock !== undefined && stock !== "" ? parseInt(stock, 10) : 0,
    rating: rating !== undefined && rating !== "" ? Number(rating) : 4,
    description: description || "",
    image,
  });

  res.status(201).json({ success: true, data: product });
});

/**
 * @desc    Update an existing product
 * @route   PUT /api/products/:id
 * @access  Private/Admin
 */
export const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400);
    throw new Error("Invalid product id");
  }

  const product = await Product.findById(id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const allowedFields = [
    "name",
    "brand",
    "type",
    "price",
    "originalPrice",
    "stock",
    "rating",
    "description",
    "image",
  ];

  if (req.body.type && !ALLOWED_TYPES.includes(req.body.type)) {
    res.status(400);
    throw new Error(`Type must be one of: ${ALLOWED_TYPES.join(", ")}`);
  }

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      product[field] = req.body[field];
    }
  });

  const updated = await product.save();

  res.status(200).json({ success: true, data: updated });
});

/**
 * @desc    Delete a product
 * @route   DELETE /api/products/:id
 * @access  Private/Admin
 */
export const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400);
    throw new Error("Invalid product id");
  }

  const product = await Product.findById(id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  await product.deleteOne();

  res.status(200).json({ success: true, data: { message: "Product deleted" } });
});
