import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const CategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, trim: true, maxlength: 300 },
    image: { type: String },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type CategoryDoc = InferSchemaType<typeof CategorySchema> & { _id: mongoose.Types.ObjectId };
export const Category: Model<CategoryDoc> =
  (mongoose.models.Category as Model<CategoryDoc>) || mongoose.model<CategoryDoc>("Category", CategorySchema);
