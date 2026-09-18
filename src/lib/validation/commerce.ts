import { z } from "zod";
import { FABRICS, FITS, GENDERS, MOOD_SLUGS, ORDER_STATUSES, SIZES } from "@/lib/constants";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id.");

export const cartAddSchema = z.object({
  productId: objectId,
  color: z.string().trim().min(1, "Choose a colour."),
  size: z.string().trim().min(1, "Choose a size."),
  quantity: z.number().int().min(1).max(10).default(1),
});
export const cartUpdateSchema = z.object({
  itemId: objectId,
  quantity: z.number().int().min(0).max(10),
});
export const cartRemoveSchema = z.object({ itemId: objectId });

export const wishlistAddSchema = z.object({
  productId: objectId,
  collectionId: objectId.nullable().optional(),
});
export const wishlistMoveSchema = z.object({
  itemId: objectId,
  collectionId: objectId.nullable(),
});
export const wishlistCollectionSchema = z.object({ name: z.string().trim().min(1, "Give it a name.").max(40) });

export const checkoutSchema = z.object({
  address: z.object({
    fullName: z.string().trim().min(2).max(80),
    line1: z.string().trim().min(3).max(120),
    line2: z.string().trim().max(120).optional().or(z.literal("")),
    city: z.string().trim().min(2).max(60),
    state: z.string().trim().min(2).max(60),
    postalCode: z.string().trim().min(4).max(12),
    country: z.string().trim().min(2).max(60),
    phone: z.string().trim().min(8).max(20),
  }),
  deliveryMethod: z.enum(["standard", "express"]).default("standard"),
  saveAddress: z.boolean().optional(),
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1, "Pick a rating.").max(5),
  title: z.string().trim().max(80).optional().or(z.literal("")),
  body: z.string().trim().min(10, "Say a little more (10+ characters).").max(1200),
});

export const productInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only.").optional(),
  description: z.string().trim().min(10).max(600),
  story: z.string().trim().max(2000).optional().or(z.literal("")),
  price: z.number().int().min(0),
  compareAtPrice: z.number().int().min(0).nullable().optional(),
  categoryId: objectId,
  fabric: z.enum(FABRICS),
  material: z.string().trim().max(200).optional().or(z.literal("")),
  fit: z.enum(FITS).default("regular"),
  care: z.array(z.string().trim().min(1).max(80)).max(8).default([]),
  gender: z.enum(GENDERS).default("unisex"),
  colors: z.array(z.object({ name: z.string().trim().min(1).max(30), hex: z.string().regex(/^#[0-9a-f]{6}$/i) })).min(1, "Add at least one colour."),
  sizes: z.array(z.enum(SIZES)).min(1, "Add at least one size."),
  variants: z.array(z.object({ sku: z.string().trim().min(1).max(40), color: z.string(), size: z.enum(SIZES), stock: z.number().int().min(0) })).optional(),
  images: z.array(z.object({ url: z.string().url().max(600), alt: z.string().max(160).optional().default("") })).max(8).default([]),
  tags: z.array(z.string().trim().toLowerCase().min(1).max(30)).max(20).default([]),
  moods: z.array(z.enum(MOOD_SLUGS as unknown as [string, ...string[]])).default([]),
  occasions: z.array(z.string().trim().toLowerCase().max(30)).max(10).default([]),
  seasons: z.array(z.string().trim().toLowerCase().max(20)).max(4).default([]),
  pairsWith: z.array(objectId).max(8).default([]),
  featured: z.boolean().default(false),
  status: z.enum(["active", "draft", "archived"]).default("active"),
});
export const productPatchSchema = productInputSchema.partial();

export const categoryInputSchema = z.object({
  name: z.string().trim().min(2).max(60),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().trim().max(300).optional().or(z.literal("")),
  image: z.string().url().optional().or(z.literal("")),
  order: z.number().int().optional(),
});

export const orderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: z.string().trim().max(200).optional(),
});

export const userRoleSchema = z.object({ role: z.enum(["customer", "admin"]) });

export const signalSchema = z.object({
  type: z.enum(["view", "search", "save", "cart", "style"]),
  productId: objectId.optional(),
  query: z.string().trim().max(200).optional(),
  styleTags: z.array(z.string().trim().max(24)).max(12).optional(),
});

export const listQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  category: z.string().trim().max(60).optional(),
  fabric: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  mood: z.string().optional(),
  fit: z.string().optional(),
  gender: z.string().optional(),
  price_gte: z.coerce.number().min(0).optional(),
  price_lte: z.coerce.number().min(0).optional(),
  sort: z.enum(["relevance", "newest", "price-asc", "price-desc", "rating", "popular"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(48).optional(),
  inStock: z.enum(["true", "false"]).optional(),
  status: z.enum(["active", "draft", "archived", "all"]).optional(),
});
export type ListQuery = z.infer<typeof listQuerySchema>;
