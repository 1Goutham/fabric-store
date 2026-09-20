export const BRAND = {
  name: "FabricNest",
  tagline: "Made for the way you move.",
  creator: "1Goutham",
  creatorUrl: "https://1goutham.space",
  signature: "A product by Goutham",
} as const;

export const CURRENCY = { code: "INR", symbol: "₹", locale: "en-IN" } as const;

export const ROLES = ["customer", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const FABRICS = ["Cotton", "Linen", "Knitted", "Synthetic", "Designer", "Wool", "Silk", "Denim"] as const;
export type Fabric = (typeof FABRICS)[number];

export const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "One size"] as const;
export type Size = (typeof SIZES)[number];

export const FITS = ["relaxed", "regular", "slim", "oversized"] as const;
export type Fit = (typeof FITS)[number];

export const MOODS = [
  { slug: "everyday", name: "Everyday", blurb: "The pieces you reach for without thinking." },
  { slug: "minimal", name: "Minimal", blurb: "Clean lines, quiet colour, nothing extra." },
  { slug: "statement", name: "Statement", blurb: "One piece that does the talking." },
  { slug: "work", name: "Work", blurb: "Sharp enough for the room, soft enough for the day." },
  { slug: "weekend", name: "Weekend", blurb: "Loose, light, unhurried." },
] as const;
export type MoodSlug = (typeof MOODS)[number]["slug"];
export const MOOD_SLUGS = MOODS.map((m) => m.slug) as unknown as readonly MoodSlug[];

export const GENDERS = ["men", "women", "unisex"] as const;

export const ORDER_STATUSES = ["confirmed", "processing", "shipped", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const DELIVERY_METHODS = {
  standard: { id: "standard", label: "Standard", eta: "4–6 days", price: 0, freeAbove: 0 },
  express: { id: "express", label: "Express", eta: "1–2 days", price: 249, freeAbove: Infinity },
} as const;
export type DeliveryMethod = keyof typeof DELIVERY_METHODS;

export const TAX_RATE = 0.05; // 5% GST on apparel under the common slab; kept simple and server-side.
export const FREE_SHIPPING_THRESHOLD = 1999;

export const PAGE_SIZE = 12;
