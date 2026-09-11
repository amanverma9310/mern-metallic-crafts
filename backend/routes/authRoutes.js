import express from "express";
import {
  registerUser,
  loginUser,
  loginAdmin,
  getMe,
  logoutUser,
  changeAdminPassword,
} from "../controllers/authController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/admin/login", loginAdmin);
router.get("/me", protect, getMe);
router.post("/logout", protect, logoutUser);
router.put("/admin/password", protect, admin, changeAdminPassword);

export default router;
