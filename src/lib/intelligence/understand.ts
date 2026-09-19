import { z } from "zod";
import type { ShoppingIntent } from "@/types";
import { FABRICS, FITS, MOOD_SLUGS } from "@/lib/constants";
import { parseIntentRules } from "./intent";
import { generateText, geminiEnabled } from "./gemini";
import { CATEGORY_SYNONYMS, COLOR_LEXICON } from "./vocab";

/**
 * Query understanding:
 *   1. rules parser (always)
 *   2. Gemini structured output (when configured) to catch phrasing the rules miss
 *   3. merge: model output is validated against the catalogue vocabulary
 */
const CATEGORY_SLUGS = Object.keys(CATEGORY_SYNONYMS);
const COLOR_KEYS = Object.keys(COLOR_LEXICON);

const modelIntentSchema = z.object({
  categories: z.array(z.enum(CATEGORY_SLUGS as [string, ...string[]])).default([]),
  colors: z.array(z.enum(COLOR_KEYS as [string, ...string[]])).default([]),
  fabrics: z.array(z.enum(FABRICS)).default([]),
  moods: z.array(z.enum(MOOD_SLUGS as unknown as [string, ...string[]])).default([]),
  fits: z.array(z.enum(FITS)).default([]),
  occasions: z.array(z.string().max(20)).max(3).default([]),
  seasons: z.array(z.enum(["summer", "monsoon", "winter", "spring"])).default([]),
  gender: z.enum(["men", "women", "unisex"]).nullable().default(null),
  priceMin: z.number().nullable().default(null),
  priceMax: z.number().nullable().default(null),
  keywords: z.array(z.string().max(30)).max(6).default([]),
  summary: z.string().max(120).nullable().default(null),
});

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    categories: { type: "array", items: { type: "string", enum: CATEGORY_SLUGS } },
    colors: { type: "array", items: { type: "string", enum: COLOR_KEYS } },
    fabrics: { type: "array", items: { type: "string", enum: [...FABRICS] } },
    moods: { type: "array", items: { type: "string", enum: [...MOOD_SLUGS] } },
    fits: { type: "array", items: { type: "string", enum: [...FITS] } },
    occasions: { type: "array", items: { type: "string" } },
    seasons: { type: "array", items: { type: "string", enum: ["summer", "monsoon", "winter", "spring"] } },
    gender: { type: "string", enum: ["men", "women", "unisex"], nullable: true },
    priceMin: { type: "number", nullable: true },
    priceMax: { type: "number", nullable: true },
    keywords: { type: "array", items: { type: "string" } },
    summary: { type: "string", nullable: true },
  },
  required: ["categories", "colors", "fabrics", "moods", "fits", "occasions", "seasons", "keywords"],
};

const SYSTEM = `You translate a shopper's request into structured filters for FabricNest, a clothing store in India (prices in rupees).
Only use the allowed values. Leave arrays empty when the request does not imply them. Do not guess a price unless one is stated.
Moods: everyday (basics), minimal (clean/quiet), statement (bold, evenings, dates), work (office/formal), weekend (relaxed/travel).
"summary" is a warm 6-12 word paraphrase of what they want, e.g. "A quiet black shirt under ₹2,000".`;

export async function understandQuery(query: string): Promise<ShoppingIntent> {
  const rules = parseIntentRules(query);
  if (!geminiEnabled() || query.trim().length < 4) return rules;
  try {
    const raw = await generateText({
      system: SYSTEM,
      user: query.slice(0, 300),
      json: true,
      schema: RESPONSE_SCHEMA,
      temperature: 0.1,
      maxOutputTokens: 300,
      cacheKey: `intent:${query.toLowerCase().trim()}`,
    });
    const parsed = modelIntentSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) return rules;
    const m = parsed.data;
    const union = <T,>(a: T[], b: T[]) => [...new Set([...a, ...b])];
    return {
      ...rules,
      categories: union(rules.categories, m.categories),
      colors: union(rules.colors, m.colors),
      fabrics: union(rules.fabrics, m.fabrics as ShoppingIntent["fabrics"]),
      moods: union(rules.moods, m.moods as ShoppingIntent["moods"]),
      fits: union(rules.fits, m.fits as ShoppingIntent["fits"]),
      occasions: union(rules.occasions, m.occasions.map((o) => o.toLowerCase())),
      seasons: union(rules.seasons, m.seasons),
      gender: rules.gender ?? m.gender,
      priceMin: rules.priceMin ?? m.priceMin,
      priceMax: rules.priceMax ?? m.priceMax,
      keywords: rules.keywords.length ? rules.keywords : m.keywords.map((k) => k.toLowerCase()),
      summary: m.summary,
      source: "gemini",
    };
  } catch {
    return rules;
  }
}
