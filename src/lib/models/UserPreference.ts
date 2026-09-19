import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

/**
 * Progressive personalisation profile. Every field is a signal that is learned
 * from behaviour (views, saves, cart, purchases, searches) or explicitly chosen
 * (styleTags). Counters are plain maps so they stay cheap to update.
 */
const UserPreferenceSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    viewed: { type: [{ product: { type: Schema.Types.ObjectId, ref: "Product" }, count: Number, lastAt: Date }], default: [] },
    categories: { type: Map, of: Number, default: {} },
    fabrics: { type: Map, of: Number, default: {} },
    colors: { type: Map, of: Number, default: {} },
    sizes: { type: Map, of: Number, default: {} },
    moods: { type: Map, of: Number, default: {} },
    fits: { type: Map, of: Number, default: {} },
    priceSamples: { type: [Number], default: [] },
    styleTags: { type: [String], default: [] },
    searches: { type: [{ q: String, at: Date }], default: [] },
  },
  { timestamps: true }
);

export type UserPreferenceDoc = InferSchemaType<typeof UserPreferenceSchema> & { _id: mongoose.Types.ObjectId };
export const UserPreference: Model<UserPreferenceDoc> =
  (mongoose.models.UserPreference as Model<UserPreferenceDoc>) ||
  mongoose.model<UserPreferenceDoc>("UserPreference", UserPreferenceSchema);
