import { connectDB } from "@/lib/db";
import { UserPreference } from "@/lib/models/UserPreference";
import { Product } from "@/lib/models/Product";

/**
 * Progressive personalisation.
 *
 *   USER SIGNALS ──► USER PROFILE ──► retrieval / ranking (see recommend.ts)
 *
 * Signals carry different weights; a purchase says more than a glance.
 */
const WEIGHTS = { view: 1, save: 3, cart: 4, purchase: 6 } as const;
type SignalKind = keyof typeof WEIGHTS;

export interface StyleProfile {
  hasSignals: boolean;
  categories: string[];
  fabrics: string[];
  colors: string[];
  moods: string[];
  fits: string[];
  sizes: string[];
  priceBand: { min: number; max: number; median: number } | null;
  styleTags: string[];
  recentlyViewed: string[];
  recentSearches: string[];
}

const bump = (map: Map<string, number> | undefined, key: string | undefined, w: number) => {
  if (!map || !key) return;
  map.set(key, (map.get(key) ?? 0) + w);
};

export async function recordProductSignal(userId: string, productId: string, kind: SignalKind) {
  await connectDB();
  const product = await Product.findById(productId).lean();
  if (!product) return;
  const w = WEIGHTS[kind];
  const pref = (await UserPreference.findOne({ user: userId })) ?? new UserPreference({ user: userId });

  bump(pref.categories, product.categorySlug, w);
  bump(pref.fabrics, product.fabric, w);
  bump(pref.fits, product.fit ?? undefined, w);
  for (const c of product.colors ?? []) bump(pref.colors, c.name.toLowerCase(), w);
  for (const m of product.moods ?? []) bump(pref.moods, m, w);
  pref.priceSamples.push(product.price);
  if (pref.priceSamples.length > 40) pref.priceSamples.splice(0, pref.priceSamples.length - 40);

  if (kind === "view") {
    const existing = pref.viewed.find((v) => v.product?.toString() === productId);
    if (existing) {
      existing.count = (existing.count ?? 0) + 1;
      existing.lastAt = new Date();
    } else {
      pref.viewed.push({ product: product._id, count: 1, lastAt: new Date() });
    }
    pref.viewed.sort((a, b) => new Date(b.lastAt ?? 0).getTime() - new Date(a.lastAt ?? 0).getTime());
    if (pref.viewed.length > 50) pref.viewed.splice(50);
  }
  await pref.save();
}

export async function recordSizeSignal(userId: string, size: string) {
  await connectDB();
  await UserPreference.updateOne({ user: userId }, { $inc: { [`sizes.${size}`]: 2 } }, { upsert: true });
}

export async function recordSearchSignal(userId: string, q: string) {
  await connectDB();
  await UserPreference.updateOne(
    { user: userId },
    { $push: { searches: { $each: [{ q: q.slice(0, 120), at: new Date() }], $slice: -20 } } },
    { upsert: true }
  );
}

export async function setStyleTags(userId: string, tags: string[]) {
  await connectDB();
  await UserPreference.updateOne({ user: userId }, { $set: { styleTags: tags.slice(0, 12) } }, { upsert: true });
}

export async function recordPurchaseSignals(userId: string, productIds: string[]) {
  for (const id of productIds) await recordProductSignal(userId, id, "purchase");
}

const top = (map: Map<string, number> | Record<string, number> | undefined, n: number) => {
  if (!map) return [];
  const entries = map instanceof Map ? [...map.entries()] : Object.entries(map);
  return entries
    .filter(([, v]) => (v ?? 0) > 0)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .slice(0, n)
    .map(([k]) => k);
};

export async function getStyleProfile(userId: string | null): Promise<StyleProfile> {
  const empty: StyleProfile = { hasSignals: false, categories: [], fabrics: [], colors: [], moods: [], fits: [], sizes: [], priceBand: null, styleTags: [], recentlyViewed: [], recentSearches: [] };
  if (!userId) return empty;
  await connectDB();
  const pref = await UserPreference.findOne({ user: userId }).lean();
  if (!pref) return empty;
  const samples = [...(pref.priceSamples ?? [])].sort((a, b) => a - b);
  const median = samples.length ? samples[Math.floor(samples.length / 2)] : 0;
  const priceBand = samples.length >= 3 ? { min: Math.round(median * 0.6), max: Math.round(median * 1.5), median } : null;
  const profile: StyleProfile = {
    hasSignals: (pref.viewed?.length ?? 0) > 0 || samples.length > 0 || (pref.styleTags?.length ?? 0) > 0,
    categories: top(pref.categories as unknown as Record<string, number>, 3),
    fabrics: top(pref.fabrics as unknown as Record<string, number>, 2),
    colors: top(pref.colors as unknown as Record<string, number>, 3),
    moods: top(pref.moods as unknown as Record<string, number>, 2),
    fits: top(pref.fits as unknown as Record<string, number>, 2),
    sizes: top(pref.sizes as unknown as Record<string, number>, 2),
    priceBand,
    styleTags: pref.styleTags ?? [],
    recentlyViewed: (pref.viewed ?? []).slice(0, 12).map((v) => v.product?.toString() ?? "").filter(Boolean),
    recentSearches: [...(pref.searches ?? [])].reverse().slice(0, 6).map((s) => s.q ?? "").filter(Boolean),
  };
  return profile;
}

/** Human labels for the "Your style" strip. Derived, never invented. */
export function describeStyle(p: StyleProfile): string[] {
  const labels: string[] = [];
  const moodName: Record<string, string> = { minimal: "Minimal", everyday: "Everyday", statement: "Statement", work: "Work-ready", weekend: "Weekend" };
  for (const m of p.moods) if (moodName[m]) labels.push(moodName[m]);
  for (const f of p.fits) labels.push(f.charAt(0).toUpperCase() + f.slice(1));
  const neutral = new Set(["black", "white", "cream", "sand", "ivory", "grey", "charcoal", "beige", "stone", "ecru", "oat"]);
  if (p.colors.length && p.colors.every((c) => neutral.has(c))) labels.push("Neutral palette");
  else if (p.colors[0]) labels.push(`Loves ${p.colors[0]}`);
  for (const f of p.fabrics.slice(0, 1)) labels.push(f);
  for (const t of p.styleTags) if (!labels.includes(t)) labels.push(t);
  return [...new Set(labels)].slice(0, 6);
}
