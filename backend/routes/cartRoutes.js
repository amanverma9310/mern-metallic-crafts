import express from "express";
import { getCart, syncCart, clearCart } from "../controllers/cartController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getCart);
router.put("/", protect, syncCart);
router.delete("/", protect, clearCart);

export default router;
