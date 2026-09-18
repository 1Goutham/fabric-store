import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const ReviewSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, maxlength: 80 },
    body: { type: String, required: true, trim: true, maxlength: 1200 },
    verifiedPurchase: { type: Boolean, default: false },
  },
  { timestamps: true }
);
ReviewSchema.index({ product: 1, user: 1 }, { unique: true });
ReviewSchema.index({ product: 1, createdAt: -1 });

export type ReviewDoc = InferSchemaType<typeof ReviewSchema> & { _id: mongoose.Types.ObjectId; createdAt: Date };
export const Review: Model<ReviewDoc> = (mongoose.models.Review as Model<ReviewDoc>) || mongoose.model<ReviewDoc>("Review", ReviewSchema);
