import type { Fabric, Fit, MoodSlug, OrderStatus, Role, DeliveryMethod } from "@/lib/constants";

/** Serialised shapes sent to the client. Never expose Mongoose documents directly. */

export interface ProductImage {
  url: string;
  alt: string;
}
export interface ProductColor {
  name: string;
  hex: string;
}
export interface ProductVariant {
  sku: string;
  color: string;
  size: string;
  stock: number;
}

export interface ProductCard {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  image: ProductImage | null;
  hoverImage: ProductImage | null;
  colors: ProductColor[];
  categorySlug: string;
  fabric: Fabric;
  moods: MoodSlug[];
  rating: { average: number; count: number };
  inStock: boolean;
  isNew: boolean;
  tags: string[];
}

export interface ProductDetail extends ProductCard {
  description: string;
  story: string | null;
  material: string | null;
  fit: Fit;
  care: string[];
  gender: string;
  sizes: string[];
  variants: ProductVariant[];
  images: ProductImage[];
  occasions: string[];
  seasons: string[];
  stock: number;
  category: { slug: string; name: string } | null;
  createdAt: string;
}

export interface CategoryDTO {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  productCount?: number;
}

export interface CartLine {
  id: string;
  product: ProductCard;
  color: string;
  size: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  available: number;
}
export interface CartSummary {
  items: CartLine[];
  subtotal: number;
  count: number;
}

export interface WishlistCollection {
  id: string;
  name: string;
  slug: string;
  count: number;
}
export interface WishlistItem {
  id: string;
  product: ProductCard;
  collectionId: string | null;
  addedAt: string;
}
export interface WishlistDTO {
  items: WishlistItem[];
  collections: WishlistCollection[];
}

export interface Address {
  id?: string;
  label?: string;
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault?: boolean;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
  addresses: Address[];
  createdAt: string;
}

export interface OrderItemDTO {
  productId: string;
  name: string;
  slug: string;
  image: string;
  color: string;
  size: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}
export interface OrderDTO {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  items: OrderItemDTO[];
  shippingAddress: Address;
  deliveryMethod: DeliveryMethod;
  pricing: { subtotal: number; shipping: number; tax: number; total: number; currency: string };
  payment: { provider: "stripe" | "test"; status: "paid" | "refunded" };
  timeline: { status: string; at: string; note?: string }[];
  paidAt: string;
  createdAt: string;
  user?: { id: string; name: string; email: string };
}

export interface ReviewDTO {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  verifiedPurchase: boolean;
  createdAt: string;
  author: { id: string; name: string };
  isMine: boolean;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** Structured shopping intent produced by the query-understanding layer. */
export interface ShoppingIntent {
  query: string;
  keywords: string[];
  categories: string[];
  fabrics: Fabric[];
  colors: string[];
  sizes: string[];
  moods: MoodSlug[];
  fits: Fit[];
  occasions: string[];
  seasons: string[];
  gender: "men" | "women" | "unisex" | null;
  priceMin: number | null;
  priceMax: number | null;
  similarTo: string | null;
  sort: "relevance" | "price-asc" | "price-desc" | "newest" | "rating" | null;
  source: "rules" | "gemini";
  summary: string | null;
}

export interface DiscoverResult {
  intent: ShoppingIntent;
  products: ProductCard[];
  total: number;
  reasons: Record<string, string>;
  note: string | null;
}

export interface ApiOk<T> {
  ok: true;
  data: T;
}
export interface ApiFail {
  ok: false;
  error: { code: string; message: string; fields?: Record<string, string> };
}
export type ApiResponse<T> = ApiOk<T> | ApiFail;
