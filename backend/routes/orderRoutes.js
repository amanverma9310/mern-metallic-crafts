import express from "express";
import {
  placeOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  deleteAllOrders,
} from "../controllers/orderController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, placeOrder);
router.get("/me", protect, getMyOrders);
router.get("/", protect, admin, getAllOrders);
router.delete("/", protect, admin, deleteAllOrders);
router.put("/:id/status", protect, admin, updateOrderStatus);

export default router;
