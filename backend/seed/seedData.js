import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";

import connectDB from "../config/db.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Reads an image from the frontend's asset folder and returns it as a
// base64 data-URL, so the seeded catalog looks identical to the original
// hardcoded products without needing any separate file hosting/CDN setup.
const imageToDataUrl = (relativePath) => {
  const fullPath = path.join(
    __dirname,
    "../../frontend/src/assets/img",
    relativePath
  );
  const buffer = fs.readFileSync(fullPath);
  const ext = path.extname(relativePath).slice(1) || "jpeg";
  return `data:image/${ext};base64,${buffer.toString("base64")}`;
};

// Same catalog that used to live in frontend/src/data/products.js.
const buildSampleProducts = () => [
  {
    name: "Modern Wall Clock",
    brand: "ClockCraft",
    price: 45.99,
    originalPrice: 59.99,
    image: imageToDataUrl("product-1.jpg"),
    type: "wall",
    rating: 4.5,
    reviews: 128,
    stock: 15,
    description: "Beautiful modern wall clock with minimalist design",
  },
  {
    name: "Digital Alarm Clock",
    brand: "TimeKeeper",
    price: 24.99,
    originalPrice: 34.99,
    image: imageToDataUrl("img2.jpg"),
    type: "alarm",
    rating: 4.2,
    reviews: 89,
    stock: 20,
    description: "Advanced digital alarm clock with smart features",
  },
  {
    name: "Luxury Chronograph",
    brand: "EliteTime",
    price: 299.99,
    originalPrice: 399.99,
    image: imageToDataUrl("img-3.jpg"),
    type: "luxury",
    rating: 5,
    reviews: 234,
    stock: 5,
    description: "Exquisite luxury chronograph watch",
  },
  {
    name: "Vintage Wall Clock",
    brand: "RetroStyle",
    price: 55.99,
    originalPrice: 75.99,
    image: imageToDataUrl("img-4.jpg"),
    type: "wall",
    rating: 4.7,
    reviews: 156,
    stock: 10,
    description: "Vintage style wall clock with classic charm",
  },
  {
    name: "Smart Alarm Clock",
    brand: "TechTime",
    price: 79.99,
    originalPrice: 99.99,
    image: imageToDataUrl("clock1.jpg"),
    type: "alarm",
    rating: 4.6,
    reviews: 203,
    stock: 12,
    description: "Smart alarm clock with WiFi connectivity",
  },
  {
    name: "Premium Desk Clock",
    brand: "OfficeElite",
    price: 89.99,
    originalPrice: 119.99,
    image: imageToDataUrl("clock2.jpg"),
    type: "wall",
    rating: 4.4,
    reviews: 67,
    stock: 8,
    description: "Professional desk clock for office",
  },
  {
    name: "Luxury Wall Clock",
    brand: "EliteTime",
    price: 199.99,
    originalPrice: 279.99,
    image: imageToDataUrl("clock6.jpg"),
    type: "luxury",
    rating: 4.8,
    reviews: 189,
    stock: 6,
    description: "Exquisite luxury wall clock with gold finish",
  },
  {
    name: "Minimalist Wall Clock",
    brand: "ModernDesign",
    price: 35.99,
    originalPrice: 49.99,
    image: imageToDataUrl("clock5.jpg"),
    type: "wall",
    rating: 4.3,
    reviews: 112,
    stock: 18,
    description: "Minimalist wall clock with clean lines",
  },
];

const seed = async () => {
  await connectDB();

  try {
    if (process.argv.includes("--destroy")) {
      await Promise.all([
        User.deleteMany(),
        Product.deleteMany(),
        Order.deleteMany(),
        Cart.deleteMany(),
      ]);
      console.log("🗑️  All collections cleared.");
      process.exit(0);
    }

    await Promise.all([
      Product.deleteMany(),
      Order.deleteMany(),
      Cart.deleteMany(),
    ]);

    await Product.insertMany(buildSampleProducts());
    console.log("✅ Sample products seeded.");

    // Demo customer account — same credentials shown in the Login modal.
    const existingDemoUser = await User.findOne({ email: "demo@clockstore.com" });
    if (!existingDemoUser) {
      await User.create({
        name: "Demo User",
        email: "demo@clockstore.com",
        password: "demo123",
        role: "user",
      });
      console.log("✅ Demo customer account created (demo@clockstore.com / demo123).");
    } else {
      console.log("ℹ️  Demo customer account already exists, skipping.");
    }

     const existingAdmin = await User.findOne({ email: "amanverm9310@gmail.com" });
    if (!existingAdmin) {
      await User.create({
        name: "Aman Verma",
        email: "amanverm9310@gmail.com",
        password: "Amanverma@1234",
        role: "admin",
      });
      console.log("✅ Admin account created (youremail@example.com / yourNewPassword123).");
    } else {
      console.log("ℹ️  Admin account already exists, skipping.");
    }
    console.log("🌱 Seeding complete.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
};

seed();
