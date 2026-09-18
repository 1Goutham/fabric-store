import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { Category } from "@/lib/models/Category";
import { toProductCard, toCategory } from "@/lib/commerce/serialize";
import type { ProductCard, CategoryDTO } from "@/types";

/** Server data for the editorial homepage. Cached at the page level. */
export async function getHomeData(): Promise<{ featured: ProductCard[]; newArrivals: ProductCard[]; categories: CategoryDTO[]; stories: { slug: string; title: string; standfirst: string; product: ProductCard }[] }> {
  await connectDB();
  const [featured, newest, categories] = await Promise.all([
    Product.find({ status: "active", featured: true, stock: { $gt: 0 } }).sort({ salesCount: -1 }).limit(8).lean(),
    Product.find({ status: "active" }).sort({ createdAt: -1 }).limit(8).lean(),
    Category.find().sort({ order: 1 }).lean(),
  ]);
  const cards = featured.map((p) => toProductCard(p));
  const bySlug = new Map(featured.concat(newest).map((p) => [p.slug, p]));
  const pick = (slug: string) => bySlug.get(slug) ?? featured[0] ?? newest[0];
  const storyDefs = [
    { slug: "ash-linen-shirt", title: "The linen that earns its creases.", standfirst: "Pre-washed European flax, cut with a dropped shoulder. Wear it open over a tee until October." },
    { slug: "pleated-wool-trouser", title: "One pleat, held.", standfirst: "Tropical-weight wool that breathes in March and still looks decided in a meeting." },
    { slug: "bias-slip-dress", title: "Cut at 45 degrees.", standfirst: "The bias cut is unforgiving to make and forgiving to wear. That is the whole point." },
  ];
  const stories = storyDefs
    .map((s) => {
      const p = pick(s.slug);
      return p ? { ...s, product: toProductCard(p) } : null;
    })
    .filter((s): s is NonNullable<typeof s> => Boolean(s));
  return { featured: cards, newArrivals: newest.map((p) => toProductCard(p)), categories: categories.map((c) => toCategory(c)), stories };
}
