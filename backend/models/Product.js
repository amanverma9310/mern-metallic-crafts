import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    brand: {
      type: String,
      required: [true, "Brand is required"],
      trim: true,
    },
    type: {
      type: String,
      required: [true, "Clock type is required"],
      enum: ["wall", "alarm", "luxury"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    originalPrice: {
      type: Number,
      default: null,
      min: [0, "Original price cannot be negative"],
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    // Stored as either a normal URL or a base64 data-URL (matches the
    // existing AddProductForm, which reads the uploaded file with
    // FileReader.readAsDataURL and stores the result directly).
    image: {
      type: String,
      required: [true, "Product image is required"],
    },
    rating: {
      type: Number,
      default: 4,
      min: 0,
      max: 5,
    },
    reviews: {
      type: Number,
      default: 0,
      min: 0,
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

// Auto-calculate discount % whenever price/originalPrice are set, mirroring
// the logic that used to live in the frontend's addProduct() action.
productSchema.pre("save", function calculateDiscount(next) {
  if (this.originalPrice && this.originalPrice > this.price) {
    this.discount = Math.round(
      ((this.originalPrice - this.price) / this.originalPrice) * 100
    );
  } else {
    this.discount = 0;
  }
  next();
});

const Product = mongoose.model("Product", productSchema);

export default Product;
