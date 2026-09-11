import asyncHandler from "express-async-handler";
import Cart from "../models/Cart.js";

/**
 * @desc    Get the current user's saved cart
 * @route   GET /api/cart
 * @access  Private
 */
export const getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = await Cart.create({ user: req.user._id, items: [] });
  }
  res.status(200).json({ success: true, data: cart });
});

/**
 * @desc    Replace the current user's saved cart with the given items
 *          (the frontend calls this whenever the local cart changes, so the
 *          server always mirrors what's in the browser for that user)
 * @route   PUT /api/cart
 * @access  Private
 */
export const syncCart = asyncHandler(async (req, res) => {
  const { items } = req.body;

  if (!Array.isArray(items)) {
    res.status(400);
    throw new Error("items must be an array");
  }

  const sanitizedItems = items
    .filter((item) => item && item.productId)
    .map((item) => ({
      product: item.productId,
      name: item.name,
      brand: item.brand || "",
      image: item.image || "",
      price: Number(item.price) || 0,
      quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
    }));

  const cart = await Cart.findOneAndUpdate(
    { user: req.user._id },
    { items: sanitizedItems },
    { new: true, upsert: true }
  );

  res.status(200).json({ success: true, data: cart });
});

/**
 * @desc    Clear the current user's saved cart
 * @route   DELETE /api/cart
 * @access  Private
 */
export const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOneAndUpdate(
    { user: req.user._id },
    { items: [] },
    { new: true, upsert: true }
  );
  res.status(200).json({ success: true, data: cart });
});
