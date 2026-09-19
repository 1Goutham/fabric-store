import type { MetadataRoute } from "next";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { Category } from "@/lib/models/Category";
import { resolveAppUrl } from "@/lib/env";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = resolveAppUrl();
  const statics = ["", "/shop", "/discover", "/collections", "/about"].map((p) => ({ url: `${base}${p}`, changeFrequency: "daily" as const }));
  try {
    await connectDB();
    const [products, categories] = await Promise.all([Product.find({ status: "active" }).select("slug updatedAt").lean(), Category.find().select("slug").lean()]);
    return [
      ...statics,
      ...categories.map((c) => ({ url: `${base}/shop?category=${c.slug}`, changeFrequency: "weekly" as const })),
      ...products.map((p) => ({ url: `${base}/products/${p.slug}`, lastModified: p.updatedAt, changeFrequency: "weekly" as const })),
    ];
  } catch {
    return statics;
  }
}
