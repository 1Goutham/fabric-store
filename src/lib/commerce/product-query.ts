import type { FilterQuery, SortOrder } from "mongoose";
import { connectDB } from "@/lib/db";
import { Product, type ProductDoc } from "@/lib/models/Product";
import { PAGE_SIZE } from "@/lib/constants";
import type { ListQuery } from "@/lib/validation/commerce";
import { toProductCard } from "./serialize";
import type { Pagination, ProductCard } from "@/types";

/**
 * Typed successor of the original `APIFeatures` helper: keyword search,
 * attribute filters, `price_gte`/`price_lte`, sort, and pagination.
 */
const csv = (v?: string) => (v ? v.split(",").map((s) => s.trim()).filter(Boolean) : []);

export function buildFilter(q: ListQuery, opts: { includeInactive?: boolean } = {}): FilterQuery<ProductDoc> {
  const filter: FilterQuery<ProductDoc> = {};
  if (!opts.includeInactive) filter.status = "active";
  else if (q.status && q.status !== "all") filter.status = q.status;

  if (q.q) filter.$text = { $search: q.q };
  if (q.category) filter.categorySlug = { $in: csv(q.category) };
  if (q.fabric) filter.fabric = { $in: csv(q.fabric) };
  if (q.mood) filter.moods = { $in: csv(q.mood) };
  if (q.fit) filter.fit = { $in: csv(q.fit) };
  if (q.gender) filter.gender = { $in: [...csv(q.gender), "unisex"] };
  if (q.size) filter.sizes = { $in: csv(q.size) };
  if (q.color) filter["colors.name"] = { $in: csv(q.color).map((c) => new RegExp(`^${escapeRegex(c)}$`, "i")) };
  if (q.price_gte !== undefined || q.price_lte !== undefined) {
    filter.price = {};
    if (q.price_gte !== undefined) filter.price.$gte = q.price_gte;
    if (q.price_lte !== undefined) filter.price.$lte = q.price_lte;
  }
  if (q.inStock === "true") filter.stock = { $gt: 0 };
  return filter;
}

export function buildSort(sort: ListQuery["sort"], hasText: boolean): Record<string, SortOrder | { $meta: string }> {
  switch (sort) {
    case "newest":
      return { createdAt: -1 };
    case "price-asc":
      return { price: 1, _id: 1 };
    case "price-desc":
      return { price: -1, _id: 1 };
    case "rating":
      return { "rating.average": -1, "rating.count": -1 };
    case "popular":
      return { salesCount: -1, viewCount: -1 };
    default:
      return hasText ? { score: { $meta: "textScore" }, featured: -1 } : { featured: -1, createdAt: -1 };
  }
}

export async function listProducts(q: ListQuery, opts: { includeInactive?: boolean } = {}): Promise<{ products: ProductCard[]; pagination: Pagination }> {
  await connectDB();
  const filter = buildFilter(q, opts);
  const pageSize = q.pageSize ?? PAGE_SIZE;
  const hasText = Boolean(q.q);
  const projection = hasText ? { score: { $meta: "textScore" } } : {};
  const [docs, total] = await Promise.all([
    Product.find(filter, projection)
      .sort(buildSort(q.sort, hasText))
      .skip((q.page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Product.countDocuments(filter),
  ]);
  return {
    products: docs.map((d) => toProductCard(d)),
    pagination: { page: q.page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  };
}

export async function getProductBySlug(slug: string) {
  await connectDB();
  return Product.findOne({ slug, status: "active" }).populate<{ category: { slug: string; name: string } | null }>("category", "slug name").lean();
}

export function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
