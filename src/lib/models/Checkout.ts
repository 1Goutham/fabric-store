import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * A pending checkout: the server-side snapshot of what the customer is paying
 * for. The payment provider only carries this document's id, so prices,
 * addresses and quantities can never be tampered with in transit.
 */
const CheckoutSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: {
      type: [
        {
          product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
          name: String,
          slug: String,
          image: String,
          color: String,
          size: String,
          sku: String,
          unitPrice: Number,
          quantity: Number,
          lineTotal: Number,
        },
      ],
      required: true,
    },
    shippingAddress: { type: Schema.Types.Mixed, required: true },
    deliveryMethod: { type: String, enum: ["standard", "express"], default: "standard" },
    pricing: { subtotal: Number, shipping: Number, tax: Number, total: Number, currency: { type: String, default: "INR" } },
    provider: { type: String, enum: ["stripe", "test"], required: true },
    providerSessionId: { type: String, index: true },
    status: { type: String, enum: ["pending", "completed", "failed", "expired"], default: "pending", index: true },
    order: { type: Schema.Types.ObjectId, ref: "Order" },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);
CheckoutSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 3 });

export type CheckoutDoc = InferSchemaType<typeof CheckoutSchema> & { _id: mongoose.Types.ObjectId };
export const Checkout: Model<CheckoutDoc> =
  (mongoose.models.Checkout as Model<CheckoutDoc>) || mongoose.model<CheckoutDoc>("Checkout", CheckoutSchema);
