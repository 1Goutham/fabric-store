import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { FABRICS, FITS, GENDERS, MOOD_SLUGS, SIZES } from "@/lib/constants";

const VariantSchema = new Schema(
  {
    sku: { type: String, required: true, trim: true },
    color: { type: String, required: true, trim: true },
    size: { type: String, required: true, enum: SIZES },
    stock: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false }
);

const ProductSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true, trim: true, maxlength: 600 },
    story: { type: String, trim: true, maxlength: 2000 },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    currency: { type: String, default: "INR" },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    categorySlug: { type: String, required: true, index: true },
    fabric: { type: String, enum: FABRICS, required: true },
    material: { type: String, trim: true, maxlength: 200 },
    fit: { type: String, enum: FITS, default: "regular" },
    care: { type: [String], default: [] },
    gender: { type: String, enum: GENDERS, default: "unisex" },
    colors: { type: [{ name: { type: String, required: true }, hex: { type: String, required: true } }], default: [] },
    sizes: { type: [String], enum: SIZES, default: [] },
    variants: { type: [VariantSchema], default: [] },
    stock: { type: Number, default: 0, min: 0 },
    images: { type: [{ url: { type: String, required: true }, alt: { type: String, default: "" } }], default: [] },
    tags: { type: [String], default: [], index: true },
    moods: { type: [String], enum: MOOD_SLUGS, default: [] },
    occasions: { type: [String], default: [] },
    seasons: { type: [String], default: [] },
    pairsWith: { type: [{ type: Schema.Types.ObjectId, ref: "Product" }], default: [] },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 },
    },
    featured: { type: Boolean, default: false },
    status: { type: String, enum: ["active", "draft", "archived"], default: "active", index: true },
    salesCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Indexes that back the storefront queries.
ProductSchema.index({ name: "text", description: "text", tags: "text", material: "text" }, { weights: { name: 10, tags: 6, material: 3, description: 1 }, name: "product_text" });
ProductSchema.index({ status: 1, categorySlug: 1, price: 1 });
ProductSchema.index({ status: 1, moods: 1 });
ProductSchema.index({ status: 1, createdAt: -1 });
ProductSchema.index({ status: 1, "rating.average": -1 });
ProductSchema.index({ status: 1, salesCount: -1 });
ProductSchema.index({ "colors.name": 1 });

// Keep aggregate stock in step with variants.
ProductSchema.pre("validate", function (next) {
  if (Array.isArray(this.variants) && this.variants.length > 0) {
    this.stock = this.variants.reduce((sum, v) => sum + (v.stock ?? 0), 0);
  }
  next();
});

export type ProductDoc = InferSchemaType<typeof ProductSchema> & { _id: mongoose.Types.ObjectId; createdAt: Date; updatedAt: Date };
export const Product: Model<ProductDoc> =
  (mongoose.models.Product as Model<ProductDoc>) || mongoose.model<ProductDoc>("Product", ProductSchema);
