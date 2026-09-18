import type { CategoryDTO, OrderDTO, ProductCard, ProductDetail, ReviewDTO } from "@/types";
import type { Fabric, MoodSlug, Fit, OrderStatus, DeliveryMethod } from "@/lib/constants";

/**
 * Serializers: Mongoose documents (lean or hydrated) → plain DTOs for the client.
 * Inputs are typed structurally so populated and unpopulated shapes both work.
 */
type Id = { toString(): string };

export interface ProductLike {
  _id: Id;
  slug: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number | null;
  images?: { url: string; alt?: string | null }[] | null;
  colors?: { name: string; hex: string }[] | null;
  categorySlug: string;
  fabric: string;
  moods?: string[] | null;
  rating?: { average?: number | null; count?: number | null } | null;
  stock?: number | null;
  createdAt?: Date | string | null;
  tags?: string[] | null;
  story?: string | null;
  material?: string | null;
  fit?: string | null;
  care?: string[] | null;
  gender?: string | null;
  sizes?: string[] | null;
  variants?: { sku: string; color: string; size: string; stock: number }[] | null;
  occasions?: string[] | null;
  seasons?: string[] | null;
}

const NEW_WINDOW_DAYS = 45;

export function toProductCard(p: ProductLike): ProductCard {
  const images = p.images ?? [];
  const createdAt = p.createdAt ? new Date(p.createdAt) : new Date();
  return {
    id: p._id.toString(),
    slug: p.slug,
    name: p.name,
    price: p.price,
    compareAtPrice: p.compareAtPrice ?? null,
    image: images[0] ? { url: images[0].url, alt: images[0].alt || p.name } : null,
    hoverImage: images[1] ? { url: images[1].url, alt: images[1].alt || p.name } : null,
    colors: (p.colors ?? []).map((c) => ({ name: c.name, hex: c.hex })),
    categorySlug: p.categorySlug,
    fabric: p.fabric as Fabric,
    moods: (p.moods ?? []) as MoodSlug[],
    rating: { average: p.rating?.average ?? 0, count: p.rating?.count ?? 0 },
    inStock: (p.stock ?? 0) > 0,
    isNew: Date.now() - createdAt.getTime() < NEW_WINDOW_DAYS * 86400000,
    tags: p.tags ?? [],
  };
}

export function toProductDetail(p: ProductLike, category?: { slug: string; name: string } | null): ProductDetail {
  return {
    ...toProductCard(p),
    description: p.description,
    story: p.story ?? null,
    material: p.material ?? null,
    fit: (p.fit ?? "regular") as Fit,
    care: p.care ?? [],
    gender: p.gender ?? "unisex",
    sizes: p.sizes ?? [],
    variants: (p.variants ?? []).map((v) => ({ sku: v.sku, color: v.color, size: v.size, stock: v.stock })),
    images: (p.images ?? []).map((i) => ({ url: i.url, alt: i.alt || p.name })),
    occasions: p.occasions ?? [],
    seasons: p.seasons ?? [],
    stock: p.stock ?? 0,
    category: category ? { slug: category.slug, name: category.name } : null,
    createdAt: (p.createdAt ? new Date(p.createdAt) : new Date()).toISOString(),
  };
}

export interface CategoryLike {
  _id: Id;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
}

export function toCategory(c: CategoryLike, productCount?: number): CategoryDTO {
  return {
    id: c._id.toString(),
    name: c.name,
    slug: c.slug,
    description: c.description ?? null,
    image: c.image ?? null,
    ...(productCount !== undefined ? { productCount } : {}),
  };
}

export interface OrderLike {
  _id: Id;
  orderNumber: string;
  status: string;
  items: { product: Id; name: string; slug: string; image?: string | null; color: string; size: string; unitPrice: number; quantity: number; lineTotal: number }[];
  shippingAddress: { fullName: string; line1: string; line2?: string | null; city: string; state: string; postalCode: string; country: string; phone: string };
  deliveryMethod?: string | null;
  pricing: { subtotal: number; shipping: number; tax: number; total: number; currency?: string | null };
  payment: { provider: string; status?: string | null };
  timeline?: { status?: string | null; at?: Date | null; note?: string | null }[] | null;
  paidAt: Date | string;
  createdAt: Date | string;
}

export function toOrder(o: OrderLike, withUser?: { _id: Id; name: string; email: string } | null): OrderDTO {
  return {
    id: o._id.toString(),
    orderNumber: o.orderNumber,
    status: o.status as OrderStatus,
    items: o.items.map((i) => ({
      productId: i.product.toString(),
      name: i.name,
      slug: i.slug,
      image: i.image ?? "",
      color: i.color,
      size: i.size,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      lineTotal: i.lineTotal,
    })),
    shippingAddress: {
      fullName: o.shippingAddress.fullName,
      line1: o.shippingAddress.line1,
      line2: o.shippingAddress.line2 ?? undefined,
      city: o.shippingAddress.city,
      state: o.shippingAddress.state,
      postalCode: o.shippingAddress.postalCode,
      country: o.shippingAddress.country,
      phone: o.shippingAddress.phone,
    },
    deliveryMethod: (o.deliveryMethod ?? "standard") as DeliveryMethod,
    pricing: {
      subtotal: o.pricing.subtotal,
      shipping: o.pricing.shipping,
      tax: o.pricing.tax,
      total: o.pricing.total,
      currency: o.pricing.currency ?? "INR",
    },
    payment: { provider: o.payment.provider as "stripe" | "test", status: (o.payment.status ?? "paid") as "paid" | "refunded" },
    timeline: (o.timeline ?? []).map((t) => ({ status: t.status ?? "", at: (t.at ? new Date(t.at) : new Date()).toISOString(), note: t.note ?? undefined })),
    paidAt: new Date(o.paidAt).toISOString(),
    createdAt: new Date(o.createdAt).toISOString(),
    ...(withUser ? { user: { id: withUser._id.toString(), name: withUser.name, email: withUser.email } } : {}),
  };
}

export interface ReviewLike {
  _id: Id;
  rating: number;
  title?: string | null;
  body: string;
  verifiedPurchase?: boolean | null;
  createdAt: Date | string;
  user: { _id: Id; name: string } | Id;
}

export function toReview(r: ReviewLike, currentUserId?: string | null): ReviewDTO {
  const author = r.user && typeof r.user === "object" && "name" in r.user ? r.user : null;
  const authorId = author ? author._id.toString() : String(r.user);
  return {
    id: r._id.toString(),
    rating: r.rating,
    title: r.title ?? null,
    body: r.body,
    verifiedPurchase: r.verifiedPurchase ?? false,
    createdAt: new Date(r.createdAt).toISOString(),
    author: { id: authorId, name: author?.name ?? "Customer" },
    isMine: !!currentUserId && authorId === currentUserId,
  };
}
