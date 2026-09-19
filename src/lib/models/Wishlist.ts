import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const CollectionSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 40 },
    slug: { type: String, required: true },
  },
  { _id: true }
);

const WishlistItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    collectionId: { type: Schema.Types.ObjectId, default: null },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const WishlistSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    collections: { type: [CollectionSchema], default: [] },
    items: { type: [WishlistItemSchema], default: [] },
  },
  { timestamps: true }
);
WishlistSchema.index({ "items.product": 1 });

export type WishlistDoc = InferSchemaType<typeof WishlistSchema> & { _id: mongoose.Types.ObjectId };
export const Wishlist: Model<WishlistDoc> =
  (mongoose.models.Wishlist as Model<WishlistDoc>) || mongoose.model<WishlistDoc>("Wishlist", WishlistSchema);
