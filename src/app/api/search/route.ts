import { connectDB } from "@/lib/db";
import { Category } from "@/lib/models/Category";
import { handle, ok } from "@/lib/api/respond";
import { parseIntentRules, describeIntent } from "@/lib/intelligence/intent";
import { discover } from "@/lib/intelligence/discover";
import { escapeRegex } from "@/lib/commerce/product-query";

/**
 * Instant search for the search overlay: fast, rules-only (no model call).
 * Reuses the discovery pipeline so constraints relax honestly instead of
 * returning nothing, and reports matching categories and the parsed intent.
 */
export const GET = handle(async (req) => {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 120);
  if (q.length < 2) return ok({ products: [], categories: [], intent: null, summary: null, note: null });
  await connectDB();
  const intent = parseIntentRules(q);
  // Partial words ("lin") aren't in the lexicon yet: treat the last token as a prefix keyword.
  if (!intent.keywords.length && !intent.categories.length && !intent.fabrics.length && !intent.colors.length && !intent.moods.length && intent.priceMax === null) {
    intent.keywords = [q.split(/\s+/).pop() ?? q];
  }
  const result = await discover(intent, { limit: 6 });
  const rx = new RegExp(escapeRegex(q), "i");
  const categories = await Category.find({ $or: [{ name: rx }, { slug: { $in: intent.categories } }] }).limit(3).lean();
  return ok({ products: result.products, categories: categories.map((c) => ({ name: c.name, slug: c.slug })), intent, summary: describeIntent(intent) || null, note: result.note }, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } });
});
