import type mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models/Product";

/** The minimal product shape needed to anchor similarity; accepts lean or populated docs. */
export type Anchor = {
  _id: mongoose.Types.ObjectId;
  categorySlug: string;
  fabric: string;
  moods: string[];
  tags: string[];
  colors: { name: string; hex: string }[];
  fit?: string | null;
  price: number;
  seasons: string[];
  pairsWith?: unknown[];
};
import { toProductCard } from "@/lib/commerce/serialize";
import type { ProductCard } from "@/types";
import { getStyleProfile, type StyleProfile } from "./preferences";

/**
 * Rules-based recommendation engine.
 *
 *   USER SIGNALS → USER PROFILE → PRODUCT RETRIEVAL → RANKING → PERSONALISED RESULTS
 *
 * This is intentionally not a learned model; the scoring is transparent and
 * the reasons shown to users are the actual features that fired.
 */
export interface Recommendation {
  product: ProductCard;
  reason: string;
}

const COMPLEMENTS: Record<string, string[]> = {
  shirts: ["trousers", "denim", "outerwear"],
  "t-shirts": ["denim", "trousers", "outerwear", "knitwear"],
  trousers: ["shirts", "t-shirts", "knitwear"],
  denim: ["t-shirts", "shirts", "knitwear"],
  dresses: ["outerwear", "knitwear"],
  outerwear: ["t-shirts", "shirts", "trousers"],
  knitwear: ["trousers", "denim", "shirts"],
  "co-ords": ["outerwear"],
};

function priceCloseness(a: number, b: number) {
  const ratio = Math.abs(a - b) / Math.max(a, b, 1);
  return Math.max(0, 1 - ratio * 2); // 1 when equal, 0 when 50% apart
}

export async function similarProducts(product: Anchor, limit = 8): Promise<Recommendation[]> {
  await connectDB();
  const candidates = await Product.find({
    _id: { $ne: product._id },
    status: "active",
    $or: [{ categorySlug: product.categorySlug }, { fabric: product.fabric }, { moods: { $in: product.moods } }, { tags: { $in: product.tags } }],
  })
    .limit(80)
    .lean();

  const scored = candidates.map((c) => {
    let score = 0;
    const why: string[] = [];
    if (c.categorySlug === product.categorySlug) {
      score += 6;
      why.push(`Another ${product.categorySlug.replace(/-/g, " ").replace(/s$/, "")}`);
    }
    if (c.fabric === product.fabric) {
      score += 3;
      why.push(`Also ${product.fabric.toLowerCase()}`);
    }
    const moods = c.moods.filter((m) => product.moods.includes(m));
    score += moods.length * 2;
    if (moods[0] && !why.length) why.push(`Same ${moods[0]} mood`);
    const colors = c.colors.filter((cc) => product.colors.some((pc) => pc.name === cc.name));
    score += colors.length * 1.5;
    if (colors[0]) why.push(`In ${colors[0].name.toLowerCase()} too`);
    if (c.fit === (product.fit ?? "regular")) score += 1;
    score += priceCloseness(c.price, product.price) * 3;
    score += (c.rating?.average ?? 0) * 0.3;
    if ((c.stock ?? 0) <= 0) score -= 10;
    return { product: toProductCard(c), score, reason: why.slice(0, 2).join(" · ") || "Close in style" };
  });
  return scored.sort((a, b) => b.score - a.score).slice(0, limit).map(({ product, reason }) => ({ product, reason }));
}

export async function pairsWellWith(product: Anchor, limit = 6): Promise<Recommendation[]> {
  await connectDB();
  const out: Recommendation[] = [];
  if (product.pairsWith?.length) {
    const curated = await Product.find({ _id: { $in: product.pairsWith as mongoose.Types.ObjectId[] }, status: "active", stock: { $gt: 0 } }).lean();
    for (const c of curated) out.push({ product: toProductCard(c), reason: "Styled together" });
  }
  if (out.length < limit) {
    const cats = COMPLEMENTS[product.categorySlug] ?? [];
    const candidates = await Product.find({
      _id: { $nin: [product._id, ...out.map((o) => o.product.id)] },
      status: "active",
      stock: { $gt: 0 },
      categorySlug: { $in: cats },
    })
      .limit(60)
      .lean();
    const scored = candidates.map((c) => {
      let score = 0;
      const moods = c.moods.filter((m) => product.moods.includes(m));
      score += moods.length * 3;
      // Neutral pairing partners pair with anything; matching palettes get a nudge.
      const neutral = ["black", "white", "cream", "sand", "grey", "navy", "ecru", "stone", "charcoal", "ivory"];
      if (c.colors.some((cc) => neutral.includes(cc.name.toLowerCase()))) score += 2;
      if (c.colors.some((cc) => product.colors.some((pc) => pc.name === cc.name))) score += 1;
      if (c.seasons.some((s) => product.seasons.includes(s))) score += 1.5;
      score += (c.rating?.average ?? 0) * 0.3;
      score += cats.indexOf(c.categorySlug) === 0 ? 1 : 0;
      const reason = moods[0] ? `Completes the ${moods[0]} look` : `Pairs with a ${product.categorySlug.replace(/-/g, " ").replace(/s$/, "")}`;
      return { product: toProductCard(c), score, reason };
    });
    // Diversify: at most two per category.
    const perCat = new Map<string, number>();
    for (const s of scored.sort((a, b) => b.score - a.score)) {
      const n = perCat.get(s.product.categorySlug) ?? 0;
      if (n >= 2) continue;
      perCat.set(s.product.categorySlug, n + 1);
      out.push({ product: s.product, reason: s.reason });
      if (out.length >= limit) break;
    }
  }
  return out.slice(0, limit);
}

export async function recommendForUser(userId: string | null, opts: { limit?: number; excludeIds?: string[] } = {}): Promise<{ items: Recommendation[]; profile: StyleProfile; personalised: boolean }> {
  await connectDB();
  const limit = opts.limit ?? 8;
  const profile = await getStyleProfile(userId);
  const exclude = new Set(opts.excludeIds ?? []);

  if (!profile.hasSignals) {
    const docs = await Product.find({ status: "active", stock: { $gt: 0 } }).sort({ featured: -1, salesCount: -1, "rating.average": -1 }).limit(limit + exclude.size).lean();
    return {
      items: docs.filter((d) => !exclude.has(d._id.toString())).slice(0, limit).map((d) => ({ product: toProductCard(d), reason: d.featured ? "Editor's pick" : "Popular right now" })),
      profile,
      personalised: false,
    };
  }

  const or: Record<string, unknown>[] = [];
  if (profile.categories.length) or.push({ categorySlug: { $in: profile.categories } });
  if (profile.moods.length) or.push({ moods: { $in: profile.moods } });
  if (profile.colors.length) or.push({ "colors.name": { $in: profile.colors.map((c) => new RegExp(`^${c}$`, "i")) } });
  if (profile.fabrics.length) or.push({ fabric: { $in: profile.fabrics } });
  if (profile.styleTags.length) or.push({ tags: { $in: profile.styleTags.map((t) => t.toLowerCase()) } }, { moods: { $in: profile.styleTags.map((t) => t.toLowerCase()) } });

  const candidates = await Product.find({ status: "active", stock: { $gt: 0 }, ...(or.length ? { $or: or } : {}) }).limit(150).lean();
  const viewed = new Set(profile.recentlyViewed);

  const scored = candidates
    .filter((c) => !exclude.has(c._id.toString()))
    .map((c) => {
      let score = 0;
      const why: string[] = [];
      if (profile.categories.includes(c.categorySlug)) {
        score += 4 - profile.categories.indexOf(c.categorySlug);
        why.push(`Because you've been browsing ${c.categorySlug.replace(/-/g, " ")}`);
      }
      const mood = c.moods.find((m) => profile.moods.includes(m));
      if (mood) {
        score += 3;
        why.push(`Fits your ${mood} side`);
      }
      const color = c.colors.find((cc) => profile.colors.includes(cc.name.toLowerCase()));
      if (color) {
        score += 2;
        why.push(`In ${color.name.toLowerCase()}, like you like`);
      }
      if (profile.fabrics.includes(c.fabric)) {
        score += 2;
        why.push(`More ${c.fabric.toLowerCase()}`);
      }
      if (profile.fits.includes(c.fit ?? "")) score += 1;
      if (profile.sizes.length && profile.sizes.some((s) => (c.sizes as string[]).includes(s))) score += 0.5;
      if (profile.priceBand) {
        if (c.price >= profile.priceBand.min && c.price <= profile.priceBand.max) {
          score += 2;
          if (!why.length) why.push("In your usual price range");
        } else score -= 1;
      }
      const tag = c.tags.find((t) => profile.styleTags.map((s) => s.toLowerCase()).includes(t));
      if (tag) {
        score += 2;
        why.push(`You said ${tag}`);
      }
      if (viewed.has(c._id.toString())) score -= 1.5; // prefer discovery over repetition
      score += (c.rating?.average ?? 0) * 0.4 + Math.min(c.salesCount ?? 0, 40) * 0.03;
      return { product: toProductCard(c), score, reason: why[0] ?? "Picked for you" };
    })
    .sort((a, b) => b.score - a.score);

  // Diversify: max 3 per category.
  const perCat = new Map<string, number>();
  const items: Recommendation[] = [];
  for (const s of scored) {
    const n = perCat.get(s.product.categorySlug) ?? 0;
    if (n >= 3) continue;
    perCat.set(s.product.categorySlug, n + 1);
    items.push({ product: s.product, reason: s.reason });
    if (items.length >= limit) break;
  }
  return { items, profile, personalised: true };
}

export async function recentlyViewed(userId: string | null, limit = 8): Promise<ProductCard[]> {
  if (!userId) return [];
  const profile = await getStyleProfile(userId);
  if (!profile.recentlyViewed.length) return [];
  const docs = await Product.find({ _id: { $in: profile.recentlyViewed }, status: "active" }).lean();
  const byId = new Map(docs.map((d) => [d._id.toString(), d]));
  return profile.recentlyViewed.map((id) => byId.get(id)).filter((d) => Boolean(d)).slice(0, limit).map((d) => toProductCard(d!));
}
