import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { ROLES } from "@/lib/constants";

const AddressSchema = new Schema(
  {
    label: { type: String, default: "Home", trim: true, maxlength: 40 },
    fullName: { type: String, required: true, trim: true, maxlength: 80 },
    line1: { type: String, required: true, trim: true, maxlength: 120 },
    line2: { type: String, trim: true, maxlength: 120 },
    city: { type: String, required: true, trim: true, maxlength: 60 },
    state: { type: String, required: true, trim: true, maxlength: 60 },
    postalCode: { type: String, required: true, trim: true, maxlength: 12 },
    country: { type: String, required: true, trim: true, default: "India", maxlength: 60 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: "customer", index: true },
    avatarUrl: { type: String },
    addresses: { type: [AddressSchema], default: [] },
    resetPasswordTokenHash: { type: String, select: false },
    resetPasswordExpiresAt: { type: Date, select: false },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

export type UserDoc = InferSchemaType<typeof UserSchema> & { _id: mongoose.Types.ObjectId };
export type AddressDoc = InferSchemaType<typeof AddressSchema> & { _id: mongoose.Types.ObjectId };

export const User: Model<UserDoc> = (mongoose.models.User as Model<UserDoc>) || mongoose.model<UserDoc>("User", UserSchema);
