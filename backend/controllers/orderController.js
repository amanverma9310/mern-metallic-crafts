import asyncHandler from "express-async-handler";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Cart from "../models/Cart.js";
import { isNonEmptyString } from "../utils/validators.js";

const REQUIRED_ADDRESS_FIELDS = [
  "fullName",
  "email",
  "phone",
  "city",
  "address",
  "postalCode",
  "country",
];

/**
 * @desc    Place an order from the items currently in the user's cart
 *          (mirrors the frontend's placeOrder(shippingAddress, total) action)
 * @route   POST /api/orders
 * @access  Private
 */
export const placeOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentMethod } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400);
    throw new Error("Your cart is empty");
  }

  if (!shippingAddress || typeof shippingAddress !== "object") {
    res.status(400);
    throw new Error("Shipping address is required");
  }

  const missingField = REQUIRED_ADDRESS_FIELDS.find(
    (field) => !isNonEmptyString(shippingAddress[field])
  );
  if (missingField) {
    res.status(400);
    throw new Error("Please fill all shipping address fields");
  }

  // Re-derive prices from the database rather than trusting the client,
  // so a tampered request can't place an order at an arbitrary price.
  const orderItems = [];
  for (const item of items) {
    if (!item.productId) {
      res.status(400);
      throw new Error("Each cart item must include a productId");
    }
    const product = await Product.findById(item.productId);
    if (!product) {
      res.status(404);
      throw new Error(`Product ${item.productId} was not found`);
    }
    const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
    orderItems.push({
      product: product._id,
      name: product.name,
      image: product.image,
      price: product.price,
      quantity,
    });
  }

  const subtotal = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const orderNumber = "ORD-" + Date.now();

  const order = await Order.create({
    orderNumber,
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    subtotal,
    tax,
    total,
    paymentMethod: paymentMethod === "stripe" ? "stripe" : "cod",
    status: "pending",
  });

  // Clear the user's server-side cart now that the order has been placed.
  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

  res.status(201).json({ success: true, data: order });
});

/**
 * @desc    Get the current user's orders
 * @route   GET /api/orders/me
 * @access  Private
 */
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: orders });
});

/**
 * @desc    Get all orders (admin dashboard/orders page)
 * @route   GET /api/orders
 * @access  Private/Admin
 */
export const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({})
    .populate("user", "name email")
    .sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: orders });
});

/**
 * @desc    Delete ALL orders (used by the admin Settings "Clear All Data" action)
 * @route   DELETE /api/orders
 * @access  Private/Admin
 */
export const deleteAllOrders = asyncHandler(async (req, res) => {
  await Order.deleteMany({});
  res.status(200).json({ success: true, data: { message: "All orders deleted" } });
});

/**
 * @desc    Update an order's status
 * @route   PUT /api/orders/:id/status
 * @access  Private/Admin
 */
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = ["pending", "processing", "shipped", "delivered", "cancelled"];

  if (!allowed.includes(status)) {
    res.status(400);
    throw new Error(`Status must be one of: ${allowed.join(", ")}`);
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }

  order.status = status;
  await order.save();

  res.status(200).json({ success: true, data: order });
});
