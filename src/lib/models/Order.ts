import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { ORDER_STATUSES } from "@/lib/constants";

const OrderItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    image: { type: String, default: "" },
    color: { type: String, required: true },
    size: { type: String, required: true },
    sku: { type: String },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const AddressSchema = new Schema(
  {
    fullName: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
    phone: { type: String, required: true },
  },
  { _id: false }
);
const PricingSchema = new Schema(
  {
    subtotal: { type: Number, required: true },
    shipping: { type: Number, required: true },
    tax: { type: Number, required: true },
    total: { type: Number, required: true },
    currency: { type: String, default: "INR" },
  },
  { _id: false }
);
const PaymentSchema = new Schema(
  {
    provider: { type: String, enum: ["stripe", "test"], required: true },
    sessionId: { type: String },
    paymentIntentId: { type: String },
    status: { type: String, enum: ["paid", "refunded"], default: "paid" },
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: { type: [OrderItemSchema], required: true },
    shippingAddress: { type: AddressSchema, required: true },
    deliveryMethod: { type: String, enum: ["standard", "express"], default: "standard" },
    pricing: { type: PricingSchema, required: true },
    payment: { type: PaymentSchema, required: true },
    status: { type: String, enum: ORDER_STATUSES, default: "confirmed", index: true },
    timeline: { type: [{ status: String, at: { type: Date, default: Date.now }, note: String }], default: [] },
    paidAt: { type: Date, required: true },
    deliveredAt: { type: Date },
  },
  { timestamps: true }
);
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ "payment.sessionId": 1 }, { unique: true, sparse: true });
OrderSchema.index({ createdAt: -1 });

export type OrderDoc = InferSchemaType<typeof OrderSchema> & { _id: mongoose.Types.ObjectId; createdAt: Date; updatedAt: Date };
export const Order: Model<OrderDoc> = (mongoose.models.Order as Model<OrderDoc>) || mongoose.model<OrderDoc>("Order", OrderSchema);
