import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";

import connectDB from "./config/db.js";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// ======================================================
// MIDDLEWARE
// ======================================================

// Parse JSON
app.use(express.json({ limit: "10mb" }));

// Parse URL-encoded data
app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

// ======================================================
// CORS
// ======================================================

const allowedOrigins = (
  process.env.CORS_ORIGIN ||
  "http://localhost:5173,https://mern-metallic-crafts-git-main-aman-9df7.vercel.app"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// Vercel gives every branch/PR preview deployment its own URL
// (e.g. mern-metallic-crafts-git-main-aman-9df7.vercel.app,
// mern-metallic-crafts-abc123.vercel.app, etc). Hardcoding one exact
// preview URL breaks the next time Vercel generates a new one, so on
// top of the explicit allow-list above we also allow any *.vercel.app
// origin belonging to this project by matching its name prefix.
const VERCEL_PROJECT_PREFIX = "mern-metallic-crafts";
const isAllowedVercelPreview = (origin) => {
  try {
    const { hostname } = new URL(origin);
    return (
      hostname.endsWith(".vercel.app") &&
      hostname.startsWith(VERCEL_PROJECT_PREFIX)
    );
  } catch {
    return false;
  }
};

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow Postman, curl, server-to-server requests
      if (!origin) {
        return callback(null, true);
      }

      // Allow registered frontend URLs, and any preview URL for this project
      if (allowedOrigins.includes(origin) || isAllowedVercelPreview(origin)) {
        return callback(null, true);
      }

      console.log("❌ CORS blocked:", origin);

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },

    credentials: true,

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Origin",
      "Accept",
      "X-Requested-With",
    ],
  })
);

// Handle preflight requests
app.options("*", cors());

// ======================================================
// LOGGER
// ======================================================

if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// ======================================================
// HEALTH CHECK
// ======================================================

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: "ok",
      message: "Metallic Crafts API is running",
    },
  });
});

// ======================================================
// API ROUTES
// ======================================================

app.use("/api/auth", authRoutes);

app.use("/api/products", productRoutes);

app.use("/api/orders", orderRoutes);

app.use("/api/cart", cartRoutes);

// ======================================================
// 404 HANDLER
// ======================================================

app.use(notFound);

// ======================================================
// GLOBAL ERROR HANDLER
// ======================================================

app.use(errorHandler);

// ======================================================
// SERVER
// ======================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log("🌐 Allowed CORS origins:");
  allowedOrigins.forEach((origin) => {
    console.log(`   ✅ ${origin}`);
  });
});