import type { ShoppingIntent } from "@/types";
import type { Fabric, Fit, MoodSlug } from "@/lib/constants";
import {
  CATEGORY_SYNONYMS, COLOR_LEXICON, FABRIC_WORDS, FIT_WORDS, GENDER_WORDS, MOOD_WORDS, OCCASION_WORDS, SEASON_WORDS, SIZE_WORDS, STOPWORDS,
} from "./vocab";

/**
 * Rules-based query understanding. Deterministic, instant, zero cost.
 * The Gemini parser (gemini.ts) can upgrade it; both return the same shape.
 */
export function emptyIntent(query: string): ShoppingIntent {
  return {
    query, keywords: [], categories: [], fabrics: [], colors: [], sizes: [], moods: [], fits: [], occasions: [], seasons: [],
    gender: null, priceMin: null, priceMax: null, similarTo: null, sort: null, source: "rules", summary: null,
  };
}

const norm = (s: string) => s.toLowerCase().replace(/[’']/g, "'").replace(/[^\p{L}\p{N}\s'\-₹.,]/gu, " ");

function parseAmount(raw: string): number | null {
  const s = raw.replace(/[₹,\s]/g, "").toLowerCase();
  const m = s.match(/^(\d+(?:\.\d+)?)(k)?$/);
  if (!m) return null;
  const n = parseFloat(m[1]) * (m[2] ? 1000 : 1);
  return Number.isFinite(n) ? Math.round(n) : null;
}

const AMOUNT = String.raw`(?:rs\.?|inr|₹)?\s*(\d[\d,]*(?:\.\d+)?\s*k?)`;

export function parsePrice(text: string): { min: number | null; max: number | null } {
  const t = text.toLowerCase();
  let min: number | null = null;
  let max: number | null = null;
  let m: RegExpMatchArray | null;

  if ((m = t.match(new RegExp(String.raw`between\s*${AMOUNT}\s*(?:and|to|-)\s*${AMOUNT}`)))) {
    min = parseAmount(m[1]);
    max = parseAmount(m[2]);
  } else if ((m = t.match(new RegExp(String.raw`${AMOUNT}\s*(?:-|to)\s*${AMOUNT}`))) && parseAmount(m[1]) !== null && parseAmount(m[2]) !== null) {
    min = parseAmount(m[1]);
    max = parseAmount(m[2]);
  } else {
    if ((m = t.match(new RegExp(String.raw`(?:under|below|less than|upto|up to|max|maximum|within|not more than|cheaper than)\s*${AMOUNT}`)))) max = parseAmount(m[1]);
    if ((m = t.match(new RegExp(String.raw`(?:over|above|more than|at least|min|minimum|starting|from)\s*${AMOUNT}`)))) min = parseAmount(m[1]);
    if (min === null && max === null && (m = t.match(new RegExp(String.raw`(?:around|about|approx(?:imately)?|near|close to|~)\s*${AMOUNT}`)))) {
      const n = parseAmount(m[1]);
      if (n) {
        min = Math.round(n * 0.8);
        max = Math.round(n * 1.2);
      }
    }
    // Bare "₹2000" or "2k budget"
    if (min === null && max === null && (m = t.match(new RegExp(String.raw`(?:₹|rs\.?|inr)\s*(\d[\d,]*\s*k?)|(\d[\d,]*\s*k?)\s*(?:budget|rupees|rs|inr|bucks)`)))) {
      const n = parseAmount(m[1] ?? m[2]);
      if (n) max = n;
    }
  }
  // Sanity: ignore tiny numbers (sizes like "2xl" already stripped) and absurd ones.
  if (max !== null && (max < 100 || max > 1_000_000)) max = null;
  if (min !== null && (min < 100 || min > 1_000_000)) min = null;
  if (min !== null && max !== null && min > max) [min, max] = [max, min];
  return { min, max };
}

function matchLexicon<T extends string>(tokens: string[], phrase: string, lexicon: Record<T, string[]>): T[] {
  const hits = new Set<T>();
  for (const key of Object.keys(lexicon) as T[]) {
    for (const w of lexicon[key]) {
      if (w.includes(" ") ? phrase.includes(w) : tokens.includes(w)) {
        hits.add(key);
        break;
      }
    }
  }
  return [...hits];
}

export function parseIntentRules(query: string): ShoppingIntent {
  const intent = emptyIntent(query.trim());
  const phrase = norm(query);
  const tokens = phrase.split(/\s+/).filter(Boolean);

  const { min, max } = parsePrice(phrase);
  intent.priceMin = min;
  intent.priceMax = max;

  intent.categories = matchLexicon(tokens, phrase, CATEGORY_SYNONYMS);
  intent.colors = matchLexicon(tokens, phrase, COLOR_LEXICON);
  intent.fabrics = matchLexicon(tokens, phrase, FABRIC_WORDS) as Fabric[];
  intent.moods = matchLexicon(tokens, phrase, MOOD_WORDS) as MoodSlug[];
  intent.fits = matchLexicon(tokens, phrase, FIT_WORDS) as Fit[];
  intent.occasions = matchLexicon(tokens, phrase, OCCASION_WORDS);
  intent.seasons = matchLexicon(tokens, phrase, SEASON_WORDS);
  const genders = matchLexicon(tokens, phrase, GENDER_WORDS);
  intent.gender = genders.length === 1 ? genders[0] : null;

  // "Denim" is both a fabric and a category; jeans → the denim category.
  if (intent.fabrics.includes("Denim") && !intent.categories.includes("denim") && tokens.some((t) => t.startsWith("jean"))) intent.categories.push("denim");

  // Sizes: only when clearly a size ("size m", "in medium", "xl").
  const sizeMatch = phrase.match(/\b(?:size|in)\s+(xs|s|m|l|xl|xxl|2xl|small|medium|large|extra small|extra large)\b/);
  if (sizeMatch) intent.sizes = [SIZE_WORDS[sizeMatch[1]]];
  else for (const t of tokens) if (["xs", "xl", "xxl", "2xl", "medium", "large", "small"].includes(t)) intent.sizes.push(SIZE_WORDS[t]);
  intent.sizes = [...new Set(intent.sizes)];

  if (/\b(cheapest|lowest price|low to high|budget first)\b/.test(phrase)) intent.sort = "price-asc";
  else if (/\b(most expensive|high to low|priciest)\b/.test(phrase)) intent.sort = "price-desc";
  else if (/\b(newest|latest|new arrivals|just in|recent)\b/.test(phrase)) intent.sort = "newest";
  else if (/\b(best rated|top rated|highest rated|popular|bestseller|best seller)\b/.test(phrase)) intent.sort = "rating";

  // Whatever is left becomes free-text keywords for the text index.
  const consumed = new Set<string>();
  const addAll = (lex: Record<string, string[]>) => Object.values(lex).flat().forEach((w) => consumed.add(w));
  [CATEGORY_SYNONYMS, COLOR_LEXICON, FABRIC_WORDS, MOOD_WORDS, FIT_WORDS, OCCASION_WORDS, SEASON_WORDS, GENDER_WORDS].forEach((l) => addAll(l as Record<string, string[]>));
  intent.keywords = tokens
    .map((t) => t.replace(/^[.,'-]+|[.,'-]+$/g, ""))
    .filter((t) => t.length > 2 && !STOPWORDS.has(t) && !consumed.has(t) && !/^(₹|rs\.?|inr)?\d/.test(t) && !/^(xs|xl|xxl|2xl)$/.test(t));

  return intent;
}

/** One line a human can read back: "Linen shirts · under ₹2,000 · minimal". */
export function describeIntent(i: ShoppingIntent): string {
  const parts: string[] = [];
  const cats = i.categories.map((c) => c.replace(/-/g, " "));
  const lead = [i.colors[0], i.fabrics[0]?.toLowerCase(), cats[0] ?? (i.keywords[0] ?? null)].filter(Boolean).join(" ");
  if (lead) parts.push(lead.charAt(0).toUpperCase() + lead.slice(1));
  if (i.priceMax !== null && i.priceMin !== null) parts.push(`₹${i.priceMin.toLocaleString("en-IN")}–₹${i.priceMax.toLocaleString("en-IN")}`);
  else if (i.priceMax !== null) parts.push(`under ₹${i.priceMax.toLocaleString("en-IN")}`);
  else if (i.priceMin !== null) parts.push(`over ₹${i.priceMin.toLocaleString("en-IN")}`);
  for (const m of i.moods.slice(0, 2)) parts.push(m);
  for (const o of i.occasions.slice(0, 1)) parts.push(`for ${o}`);
  for (const s of i.seasons.slice(0, 1)) parts.push(s);
  if (i.fits[0]) parts.push(`${i.fits[0]} fit`);
  if (i.sizes[0]) parts.push(`size ${i.sizes[0]}`);
  return parts.join(" · ");
}
