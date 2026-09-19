import type { FilterQuery } from "mongoose";
import { connectDB } from "@/lib/db";
import { Product, type ProductDoc } from "@/lib/models/Product";
import { toProductCard } from "@/lib/commerce/serialize";
import { escapeRegex } from "@/lib/commerce/product-query";
import type { DiscoverResult, ProductCard, ShoppingIntent } from "@/types";
import { COLOR_LEXICON } from "./vocab";
import { describeIntent } from "./intent";
import type { StyleProfile } from "./preferences";

/**
 *   USER INTENT → QUERY UNDERSTANDING → PRODUCT RETRIEVAL → FILTERING → RANKING → RESULTS
 *
 * Retrieval is a MongoDB query built from the intent. If nothing matches, the
 * constraints are relaxed one at a time (softest first) and the relaxation is
 * reported honestly in `note`.
 */
type Relax = "none" | "keywords" | "colors" | "fits" | "moods" | "price" | "categories";
const RELAX_ORDER: Relax[] = ["none", "keywords", "colors", "fits", "moods", "price", "categories"];

function colorRegexes(colors: string[]) {
  const words = colors.flatMap((c) => COLOR_LEXICON[c] ?? [c]);
  return words.map((w) => new RegExp(escapeRegex(w), "i"));
}

export function intentToFilter(intent: ShoppingIntent, relaxed: Set<Relax>): FilterQuery<ProductDoc> {
  const f: FilterQuery<ProductDoc> = { status: "active" };
  if (intent.categories.length && !relaxed.has("categories")) f.categorySlug = { $in: intent.categories };
  if (intent.fabrics.length) f.fabric = { $in: intent.fabrics };
  if (intent.colors.length && !relaxed.has("colors")) f["colors.name"] = { $in: colorRegexes(intent.colors) };
  if (intent.sizes.length) f.sizes = { $in: intent.sizes };
  if (intent.fits.length && !relaxed.has("fits")) f.fit = { $in: intent.fits };
  if (intent.gender) f.gender = { $in: [intent.gender, "unisex"] };
  if (intent.moods.length && !relaxed.has("moods")) f.moods = { $in: intent.moods };
  if (!relaxed.has("price")) {
    if (intent.priceMin !== null || intent.priceMax !== null) {
      f.price = {};
      if (intent.priceMin !== null) f.price.$gte = intent.priceMin;
      if (intent.priceMax !== null) f.price.$lte = intent.priceMax;
    }
  } else if (intent.priceMax !== null) {
    f.price = { $lte: Math.round(intent.priceMax * 1.25) };
  }
  if (intent.keywords.length && !relaxed.has("keywords")) f.$text = { $search: intent.keywords.join(" ") };
  return f;
}

export interface Scored {
  card: ProductCard;
  score: number;
  reasons: string[];
}

/** Rules-based ranking. Weights are explicit so they can be tuned or replaced by a learned model. */
export function scoreProduct(p: ProductDoc & { score?: number }, intent: ShoppingIntent, profile?: StyleProfile | null): Scored {
  let score = 0;
  const reasons: string[] = [];
  const card = toProductCard(p);

  if (p.score) score += Math.min(p.score, 6) * 2; // text relevance
  if (intent.categories.includes(p.categorySlug)) score += 8;
  if (intent.fabrics.includes(p.fabric as ShoppingIntent["fabrics"][number])) {
    score += 6;
    reasons.push(p.fabric);
  }
  const colorHit = intent.colors.find((c) => (COLOR_LEXICON[c] ?? [c]).some((w) => p.colors.some((pc) => pc.name.toLowerCase().includes(w))));
  if (colorHit) {
    score += 5;
    reasons.push(`in ${colorHit}`);
  }
  const productMoods = (p.moods ?? []) as string[];
  const moodHits = intent.moods.filter((m) => productMoods.includes(m));
  score += moodHits.length * 4;
  if (moodHits[0]) reasons.push(moodHits[0]);
  const occHits = intent.occasions.filter((o) => p.occasions.includes(o));
  score += occHits.length * 4;
  if (occHits[0]) reasons.push(`for ${occHits[0]}`);
  const seasonHits = intent.seasons.filter((s) => p.seasons.includes(s));
  score += seasonHits.length * 3;
  if (seasonHits[0]) reasons.push(`${seasonHits[0]}-ready`);
  if (intent.fits.includes(p.fit as ShoppingIntent["fits"][number])) {
    score += 3;
    reasons.push(`${p.fit} fit`);
  }
  if (intent.priceMax !== null) {
    if (p.price <= intent.priceMax) {
      score += 3;
      reasons.push(`under ₹${intent.priceMax.toLocaleString("en-IN")}`);
    } else score -= 6;
  }

  // Personalisation boost: small, so intent always wins.
  if (profile?.hasSignals) {
    if (profile.categories.includes(p.categorySlug)) score += 1.5;
    if (profile.moods.some((m) => productMoods.includes(m))) score += 1.5;
    if (profile.colors.some((c) => p.colors.some((pc) => pc.name.toLowerCase() === c))) score += 1;
    if (profile.fabrics.includes(p.fabric)) score += 1;
    if (profile.priceBand && p.price >= profile.priceBand.min && p.price <= profile.priceBand.max) score += 1;
  }

  score += (p.rating?.average ?? 0) * 0.6;
  score += Math.min(p.salesCount ?? 0, 50) * 0.02;
  if ((p.stock ?? 0) <= 0) score -= 20;
  if (p.featured) score += 0.5;

  return { card, score, reasons: [...new Set(reasons)].slice(0, 3) };
}

function sortKey(intent: ShoppingIntent) {
  switch (intent.sort) {
    case "price-asc":
      return (a: Scored, b: Scored) => a.card.price - b.card.price;
    case "price-desc":
      return (a: Scored, b: Scored) => b.card.price - a.card.price;
    case "rating":
      return (a: Scored, b: Scored) => b.card.rating.average - a.card.rating.average || b.score - a.score;
    default:
      return (a: Scored, b: Scored) => b.score - a.score;
  }
}

export async function discover(intent: ShoppingIntent, opts: { limit?: number; profile?: StyleProfile | null; excludeIds?: string[] } = {}): Promise<DiscoverResult> {
  await connectDB();
  const limit = opts.limit ?? 24;
  const hasConstraints =
    intent.categories.length || intent.fabrics.length || intent.colors.length || intent.moods.length || intent.keywords.length || intent.priceMax !== null || intent.priceMin !== null || intent.occasions.length || intent.seasons.length || intent.fits.length || intent.sizes.length;

  const relaxed = new Set<Relax>();
  let docs: (ProductDoc & { score?: number })[] = [];
  let usedRelax: Relax = "none";

  if (!hasConstraints) {
    docs = await Product.find({ status: "active" }).sort({ featured: -1, salesCount: -1 }).limit(limit * 2).lean();
  } else {
    for (const step of RELAX_ORDER) {
      if (step !== "none") relaxed.add(step);
      const filter = intentToFilter(intent, relaxed);
      const q = filter.$text ? Product.find(filter, { score: { $meta: "textScore" } }) : Product.find(filter);
      if (opts.excludeIds?.length) q.where("_id").nin(opts.excludeIds);
      docs = await q.limit(120).lean();
      usedRelax = step;
      if (docs.length >= 3) break;
    }
    if (docs.length === 0 && intent.sort === null) {
      // Absolute fallback: newest arrivals, clearly labelled as such.
      docs = await Product.find({ status: "active" }).sort({ createdAt: -1 }).limit(12).lean();
      usedRelax = "categories";
    }
  }

  const scored = docs.map((d) => scoreProduct(d, intent, opts.profile)).sort(sortKey(intent)).slice(0, limit);
  const reasons: Record<string, string> = {};
  for (const s of scored) if (s.reasons.length) reasons[s.card.id] = s.reasons.join(" · ");

  const note = noteFor(usedRelax, intent);
  return { intent, products: scored.map((s) => s.card), total: scored.length, reasons, note };
}

function noteFor(relax: Relax, intent: ShoppingIntent): string | null {
  const what = describeIntent(intent) || "that";
  switch (relax) {
    case "none":
      return null;
    case "keywords":
      return `We couldn't find an exact match for "${intent.query}". Here's the closest to ${what}.`;
    case "colors":
      return `Nothing quite in ${intent.colors.join(" or ")} right now. Here's the same idea in other colours.`;
    case "fits":
      return `No ${intent.fits.join("/")} fits matched exactly. Showing the closest cuts.`;
    case "moods":
      return `We widened the mood a little to find you more options.`;
    case "price":
      return intent.priceMax !== null
        ? `Nothing under ₹${intent.priceMax.toLocaleString("en-IN")} matched exactly. These come closest, up to ₹${Math.round(intent.priceMax * 1.25).toLocaleString("en-IN")}.`
        : `We relaxed the price a little to find you more options.`;
    case "categories":
      return `We couldn't find an exact match. Here's what's closest, and newest.`;
  }
}
