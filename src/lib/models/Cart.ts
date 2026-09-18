import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const CartItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    color: { type: String, required: true },
    size: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1, max: 10, default: 1 },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const CartSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: { type: [CartItemSchema], default: [] },
  },
  { timestamps: true }
);

export type CartItemDoc = InferSchemaType<typeof CartItemSchema> & { _id: mongoose.Types.ObjectId };
export type CartDoc = InferSchemaType<typeof CartSchema> & { _id: mongoose.Types.ObjectId };
export const Cart: Model<CartDoc> = (mongoose.models.Cart as Model<CartDoc>) || mongoose.model<CartDoc>("Cart", CartSchema);
