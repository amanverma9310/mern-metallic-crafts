import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import { isValidEmail, isValidPassword, isNonEmptyString } from "../utils/validators.js";

/**
 * @desc    Register a new customer account
 * @route   POST /api/auth/register
 * @access  Public
 */
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  if (!isNonEmptyString(name) || !isNonEmptyString(email) || !isNonEmptyString(password)) {
    res.status(400);
    throw new Error("Please fill all fields");
  }

  if (!isValidEmail(email)) {
    res.status(400);
    throw new Error("Please enter a valid email address");
  }

  if (!isValidPassword(password)) {
    res.status(400);
    throw new Error("Password must be at least 6 characters");
  }

  if (confirmPassword !== undefined && password !== confirmPassword) {
    res.status(400);
    throw new Error("Passwords do not match");
  }

  const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (existingUser) {
    res.status(400);
    throw new Error("An account with that email already exists");
  }

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    role: "user",
  });

  const token = generateToken(user);

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    },
  });
});

/**
 * @desc    Login as a customer
 * @route   POST /api/auth/login
 * @access  Public
 */
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
    res.status(400);
    throw new Error("Please fill all fields");
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  const token = generateToken(user);

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    },
  });
});

/**
 * @desc    Login as an admin (role must be "admin")
 * @route   POST /api/auth/admin/login
 * @access  Public
 */
export const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
    res.status(400);
    throw new Error("Please fill all fields");
  }

  const admin = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");

  if (!admin || admin.role !== "admin" || !(await admin.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  const token = generateToken(admin);

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
      token,
    },
  });
});

/**
 * @desc    Get the currently authenticated user (from the JWT)
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res) => {
  // req.user is already the sanitized (no password) document from `protect`.
  res.status(200).json({
    success: true,
    data: { user: req.user },
  });
});

/**
 * @desc    Log out. JWTs are stateless, so logout is handled client-side by
 *          discarding the stored token; this endpoint exists mainly so the
 *          frontend has a symmetrical, explicit call to make (and as a place
 *          to hook in token-blacklisting later if ever needed).
 * @route   POST /api/auth/logout
 * @access  Private
 */
export const logoutUser = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: { message: "Logged out" } });
});

/**
 * @desc    Change the currently authenticated admin's password
 * @route   PUT /api/auth/admin/password
 * @access  Private/Admin
 */
export const changeAdminPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;

  if (!isValidPassword(newPassword)) {
    res.status(400);
    throw new Error("Password must be at least 6 characters");
  }

  const admin = await User.findById(req.user._id).select("+password");
  admin.password = newPassword;
  await admin.save();

  res.status(200).json({
    success: true,
    data: { message: "Admin password updated successfully" },
  });
});
