import { FABRICS, FITS, MOOD_SLUGS, type Fabric, type Fit, type MoodSlug } from "@/lib/constants";

/**
 * Lexicon used by the rules-based intent parser and to validate model output.
 * Category slugs must match the seeded categories.
 */
export const CATEGORY_SYNONYMS: Record<string, string[]> = {
  shirts: ["shirt", "shirts", "button-down", "buttondown", "overshirt", "oxford"],
  "t-shirts": ["tee", "tees", "t-shirt", "t-shirts", "tshirt", "tshirts", "top", "tops"],
  trousers: ["trouser", "trousers", "pants", "chino", "chinos", "slacks", "bottoms"],
  denim: ["jeans", "jean", "denim"],
  dresses: ["dress", "dresses", "midi", "maxi", "slip"],
  outerwear: ["jacket", "jackets", "coat", "coats", "blazer", "blazers", "overcoat", "outerwear", "layer", "layers"],
  knitwear: ["knit", "knits", "knitwear", "sweater", "sweaters", "jumper", "jumpers", "cardigan", "pullover", "hoodie"],
  "co-ords": ["co-ord", "coord", "co-ords", "set", "sets", "two-piece", "matching"],
};

export const COLOR_LEXICON: Record<string, string[]> = {
  black: ["black", "jet", "noir"],
  white: ["white", "optic"],
  cream: ["cream", "ivory", "ecru", "off-white", "offwhite", "oat"],
  sand: ["sand", "beige", "camel", "tan", "khaki", "stone"],
  grey: ["grey", "gray", "charcoal", "slate", "graphite"],
  navy: ["navy", "midnight", "ink"],
  blue: ["blue", "sky", "cobalt", "indigo", "denim-blue"],
  olive: ["olive", "green", "sage", "moss", "forest"],
  brown: ["brown", "chocolate", "espresso", "mocha", "rust", "terracotta"],
  burgundy: ["burgundy", "wine", "maroon", "oxblood"],
  pink: ["pink", "blush", "rose"],
  red: ["red", "crimson", "scarlet"],
};

export const NEUTRAL_COLORS = ["black", "white", "cream", "sand", "grey", "navy"];

export const SIZE_WORDS: Record<string, string> = {
  xs: "XS", "extra small": "XS", s: "S", small: "S", m: "M", medium: "M", l: "L", large: "L", xl: "XL", "extra large": "XL", xxl: "XXL", "2xl": "XXL",
};

export const MOOD_WORDS: Record<MoodSlug, string[]> = {
  everyday: ["everyday", "daily", "basic", "basics", "essential", "essentials", "staple", "casual", "day-to-day"],
  minimal: ["minimal", "minimalist", "clean", "simple", "plain", "understated", "quiet", "subtle", "monochrome", "neutral"],
  statement: ["statement", "bold", "standout", "stand-out", "dramatic", "striking", "eye-catching", "party", "night", "date", "dinner", "evening", "wedding", "festive", "occasion"],
  work: ["work", "office", "meeting", "meetings", "formal", "smart", "professional", "interview", "business", "workwear", "presentation"],
  weekend: ["weekend", "relaxed", "laid-back", "laidback", "lounge", "easy", "brunch", "holiday", "vacation", "travel", "beach", "sunday"],
};

export const OCCASION_WORDS: Record<string, string[]> = {
  dinner: ["dinner", "date", "restaurant"],
  evening: ["evening", "night", "party", "drinks"],
  office: ["office", "work", "meeting", "interview"],
  wedding: ["wedding", "reception", "festive", "ceremony"],
  travel: ["travel", "trip", "holiday", "vacation", "airport", "flight"],
  brunch: ["brunch", "sunday", "cafe"],
  gym: ["gym", "workout", "run"],
};

export const SEASON_WORDS: Record<string, string[]> = {
  summer: ["summer", "hot", "humid", "heat", "breathable", "light", "lightweight", "airy"],
  monsoon: ["monsoon", "rain", "rainy"],
  winter: ["winter", "cold", "warm", "cosy", "cozy", "chilly", "layering"],
  spring: ["spring"],
};

export const FIT_WORDS: Record<Fit, string[]> = {
  relaxed: ["relaxed", "loose", "easy-fit", "roomy", "comfortable", "comfy"],
  regular: ["regular", "classic", "standard"],
  slim: ["slim", "fitted", "tailored", "sharp", "narrow"],
  oversized: ["oversized", "oversize", "boxy", "baggy", "drop-shoulder"],
};

export const FABRIC_WORDS: Record<Fabric, string[]> = {
  Cotton: ["cotton", "poplin", "twill", "jersey"],
  Linen: ["linen"],
  Knitted: ["knitted", "knit", "rib", "ribbed", "merino-knit"],
  Synthetic: ["synthetic", "polyester", "nylon", "technical", "tech"],
  Designer: ["designer", "premium", "luxury", "luxe"],
  Wool: ["wool", "merino", "flannel", "tweed"],
  Silk: ["silk", "satin", "sateen"],
  Denim: ["denim", "jeans"],
};

export const GENDER_WORDS: Record<"men" | "women", string[]> = {
  men: ["men", "mens", "men's", "man", "him", "male", "guy", "guys", "boyfriend", "husband", "dad", "brother"],
  women: ["women", "womens", "women's", "woman", "her", "female", "girl", "girlfriend", "wife", "mum", "mom", "sister"],
};

export const STOPWORDS = new Set([
  "i", "me", "my", "need", "want", "looking", "for", "a", "an", "the", "some", "something", "show", "find", "get", "give", "please", "under", "below", "less", "than", "over", "above", "between", "and", "or", "with", "in", "to", "of", "that", "this", "is", "it", "on", "at", "be", "can", "you", "would", "like", "love", "really", "just", "any", "good", "nice", "great", "best", "cheap", "cheapest", "budget", "affordable", "expensive", "premium", "size", "colour", "color", "coloured", "colored", "around", "about", "approx", "rs", "rupees", "inr", "₹", "wear", "outfit", "look", "clothes", "clothing", "day", "go", "going", "out", "up", "build", "help", "choose", "pick", "similar", "same", "as", "one", "piece", "buy", "shop", "bit", "more", "very", "so",
]);

export const ALL_FABRICS = FABRICS;
export const ALL_FITS = FITS;
export const ALL_MOODS = MOOD_SLUGS;
