import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email address.");
export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(72, "Keep it under 72 characters.");

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Tell us your name.").max(80),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z.object({
  token: z.string().min(20),
  password: passwordSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  password: passwordSchema,
});

export const addressSchema = z.object({
  id: z.string().optional(),
  label: z.string().trim().max(40).optional(),
  fullName: z.string().trim().min(2, "Full name is required.").max(80),
  line1: z.string().trim().min(3, "Address is required.").max(120),
  line2: z.string().trim().max(120).optional().or(z.literal("")),
  city: z.string().trim().min(2, "City is required.").max(60),
  state: z.string().trim().min(2, "State is required.").max(60),
  postalCode: z.string().trim().min(4, "Postal code is required.").max(12),
  country: z.string().trim().min(2).max(60).default("India"),
  phone: z.string().trim().min(8, "Phone number is required.").max(20),
  isDefault: z.boolean().optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  avatarUrl: z.string().url().max(500).optional().or(z.literal("")),
  addresses: z.array(addressSchema).max(6).optional(),
  styleTags: z.array(z.string().trim().min(1).max(24)).max(12).optional(),
});
