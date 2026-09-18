import { connectDB } from "@/lib/db";
import { Product, type ProductDoc } from "@/lib/models/Product";
import { toProductCard } from "@/lib/commerce/serialize";
import { formatPrice } from "@/lib/commerce/pricing";
import type { ProductCard, ShoppingIntent } from "@/types";
import { understandQuery } from "./understand";
import { discover } from "./discover";
import { pairsWellWith, similarProducts } from "./recommend";
import { generateText, geminiEnabled } from "./gemini";
import { getStyleProfile, type StyleProfile } from "./preferences";
import { describeIntent } from "./intent";

/**
 * "Ask FabricNest": a contextual shopping assistant, not a chatbot.
 * Every reply is grounded in retrieved products; the language model (when
 * configured) only writes the one-line stylist note from compact metadata.
 */
export type AssistantMode = "discover" | "similar" | "outfit" | "choose" | "compare" | "help";

export interface AssistantContext {
  productId?: string | null;
  page?: string | null;
  candidateIds?: string[];
}

export interface AssistantReply {
  mode: AssistantMode;
  reply: string;
  products: ProductCard[];
  reasons: Record<string, string>;
  compare?: CompareRow[] | null;
  suggestions: string[];
  source: "rules" | "gemini";
}

export interface CompareRow {
  product: ProductCard;
  material: string | null;
  fit: string;
  care: string[];
  moods: string[];
  stock: number;
  verdict: string;
}

function detectMode(message: string, ctx: AssistantContext): AssistantMode {
  const m = message.toLowerCase();
  if (/\b(compare|difference|vs\.?|versus|which is better)\b/.test(m) && (ctx.candidateIds?.length ?? 0) >= 2) return "compare";
  if (/\b(help me (choose|decide|pick)|which (one|should)|can'?t decide|not sure which)\b/.test(m)) return "choose";
  if (/\b(outfit|pair|goes with|go with|wear with|match with|complete the look|style (this|it) with)\b/.test(m)) return "outfit";
  if (/\b(similar|like this|same as this|more like|alternatives?|something like)\b/.test(m)) return "similar";
  if (/^(hi|hello|hey|help|what can you do)\b/.test(m)) return "help";
  return "discover";
}

const templateReply = (mode: AssistantMode, intent: ShoppingIntent | null, product: ProductDoc | null, count: number): string => {
  const moods = intent?.moods ?? product?.moods ?? [];
  const tone = moods.includes("minimal") ? "clean and minimal" : moods.includes("statement") ? "bold but considered" : moods.includes("work") ? "sharp and easy" : moods.includes("weekend") ? "relaxed and light" : "simple and wearable";
  switch (mode) {
    case "similar":
      return product ? `Here are pieces close to the ${product.name} in cut and feel.` : `Here's what sits closest to that.`;
    case "outfit":
      return product ? `I'd keep this ${tone}. These pair naturally with the ${product.name}.` : `Here's how I'd build that look.`;
    case "choose":
      return `Let's narrow it down. Start with fabric and fit, then price — here are the strongest options.`;
    case "compare":
      return `Side by side, here's how they differ.`;
    case "help":
      return `I can find things by mood, colour, price or occasion, show similar pieces, or build an outfit around something you're looking at.`;
    default: {
      const what = intent ? describeIntent(intent) : "";
      if (count === 0) return `Nothing matched that exactly, but here's the closest.`;
      return what ? `I'd keep this ${tone}. ${count} option${count === 1 ? "" : "s"} for ${what.toLowerCase()}.` : `I'd keep this ${tone}. Here's what I'd start with.`;
    }
  }
};

async function stylistNote(mode: AssistantMode, message: string, products: ProductCard[], fallback: string, profile: StyleProfile): Promise<{ text: string; source: "rules" | "gemini" }> {
  if (!geminiEnabled() || products.length === 0) return { text: fallback, source: "rules" };
  const compact = products.slice(0, 4).map((p) => `${p.name} (${p.fabric}, ${formatPrice(p.price)}, ${p.moods.join("/") || "—"})`).join("; ");
  const style = profile.hasSignals ? `Shopper leans: ${[...profile.moods, ...profile.colors.slice(0, 2)].join(", ") || "unknown"}.` : "";
  try {
    const text = await generateText({
      system: `You are FabricNest's stylist. Reply in ONE warm, confident sentence (max 22 words), plain text, no emojis, no lists, no prices. Reference the actual products' fabric, fit or mood. Never invent products or facts. ${style}`,
      user: `Shopper asked: "${message.slice(0, 200)}". Mode: ${mode}. Products shown: ${compact}.`,
      temperature: 0.5,
      maxOutputTokens: 60,
      cacheKey: `note:${mode}:${message.toLowerCase().trim()}:${products.slice(0, 4).map((p) => p.id).join(",")}`,
    });
    return { text: text.replace(/\s+/g, " ").trim().slice(0, 220) || fallback, source: "gemini" };
  } catch {
    return { text: fallback, source: "rules" };
  }
}

export async function askAssistant(message: string, ctx: AssistantContext, userId: string | null): Promise<AssistantReply> {
  await connectDB();
  const profile = await getStyleProfile(userId);
  const mode = detectMode(message, ctx);
  const product = ctx.productId ? await Product.findOne({ _id: ctx.productId, status: "active" }).lean() : null;

  if (mode === "help") {
    return {
      mode,
      reply: templateReply(mode, null, null, 0),
      products: [],
      reasons: {},
      suggestions: ["Find something for a date", "Something relaxed for a summer day", "Minimal black shirt under ₹2,000", "Build an outfit around this"],
      source: "rules",
    };
  }

  if (mode === "similar" && product) {
    const recs = await similarProducts(product, 6);
    const products = recs.map((r) => r.product);
    const note = await stylistNote(mode, message, products, templateReply(mode, null, product, products.length), profile);
    return { mode, reply: note.text, products, reasons: Object.fromEntries(recs.map((r) => [r.product.id, r.reason])), suggestions: ["Build an outfit around this", "Show me something cheaper", "In a different colour"], source: note.source };
  }

  if (mode === "outfit" && product) {
    const recs = await pairsWellWith(product, 6);
    const products = recs.map((r) => r.product);
    const note = await stylistNote(mode, message, products, templateReply(mode, null, product, products.length), profile);
    return { mode, reply: note.text, products, reasons: Object.fromEntries(recs.map((r) => [r.product.id, r.reason])), suggestions: ["Show similar styles", "Keep it under ₹3,000", "Something for the weekend"], source: note.source };
  }

  if (mode === "compare" && ctx.candidateIds?.length) {
    const rows = await compareProducts(ctx.candidateIds.slice(0, 3));
    const products = rows.map((r) => r.product);
    const note = await stylistNote(mode, message, products, templateReply(mode, null, null, products.length), profile);
    return { mode, reply: note.text, products, reasons: {}, compare: rows, suggestions: ["Which is better for summer?", "Which one is more formal?"], source: note.source };
  }

  // Discover (and "choose"): intent → retrieval → ranking.
  const intent = await understandQuery(message);
  if (product && !intent.categories.length && !intent.keywords.length && (mode === "choose" || mode === "similar" || mode === "outfit")) {
    intent.categories = [product.categorySlug];
  }
  const result = await discover(intent, { limit: mode === "choose" ? 4 : 6, profile });
  const fallback = result.note ? `${templateReply(mode, intent, product, result.products.length)} ${result.note}` : templateReply(mode, intent, product, result.products.length);
  const note = await stylistNote(mode, message, result.products, fallback, profile);
  const suggestions = suggestFollowUps(intent);
  return { mode: mode === "choose" ? "choose" : "discover", reply: note.text, products: result.products, reasons: result.reasons, suggestions, source: intent.source === "gemini" || note.source === "gemini" ? "gemini" : "rules" };
}

function suggestFollowUps(intent: ShoppingIntent): string[] {
  const out: string[] = [];
  if (intent.priceMax === null) out.push("Keep it under ₹2,000");
  else out.push(`Show me options under ₹${Math.round(intent.priceMax * 0.75).toLocaleString("en-IN")}`);
  if (!intent.colors.length) out.push("In black or cream");
  if (!intent.moods.includes("work")) out.push("Something I could wear to work");
  if (!intent.fabrics.includes("Linen")) out.push("Linen only");
  return out.slice(0, 3);
}

export async function compareProducts(ids: string[]): Promise<CompareRow[]> {
  await connectDB();
  const docs = await Product.find({ _id: { $in: ids }, status: "active" }).lean();
  const order = new Map(ids.map((id, i) => [id, i]));
  docs.sort((a, b) => (order.get(a._id.toString()) ?? 0) - (order.get(b._id.toString()) ?? 0));
  const cheapest = Math.min(...docs.map((d) => d.price));
  const bestRated = Math.max(...docs.map((d) => d.rating?.average ?? 0));
  return docs.map((d) => {
    const verdicts: string[] = [];
    if (d.price === cheapest && docs.length > 1) verdicts.push("Best value");
    if ((d.rating?.average ?? 0) === bestRated && bestRated > 0) verdicts.push("Best rated");
    if (d.fabric === "Linen" || d.seasons.includes("summer")) verdicts.push("Breathable");
    if (d.moods.includes("work")) verdicts.push("Office-safe");
    return {
      product: toProductCard(d),
      material: d.material ?? null,
      fit: d.fit ?? "regular",
      care: d.care ?? [],
      moods: d.moods ?? [],
      stock: d.stock ?? 0,
      verdict: verdicts.slice(0, 2).join(" · ") || "Solid pick",
    };
  });
}
