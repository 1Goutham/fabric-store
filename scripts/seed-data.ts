/**
 * Seed catalogue for FabricNest. Photos live in src/lib/data/catalogue-images.ts
 * so the storefront can use them too.
 */
import type { Fabric, Fit, MoodSlug } from "@/lib/constants";
import { CATEGORY_PHOTOS, PRODUCT_PHOTOS } from "@/lib/data/catalogue-images";


export const CATEGORIES = [
  { name: "Shirts", slug: "shirts", description: "Poplin, linen and oxford. Cut to be worn open or buttoned to the top.", image: CATEGORY_PHOTOS["shirts"], order: 1 },
  { name: "T-Shirts", slug: "t-shirts", description: "Heavyweight cottons with a clean drape. The base layer of everything.", image: CATEGORY_PHOTOS["t-shirts"], order: 2 },
  { name: "Trousers", slug: "trousers", description: "Pleated, tapered, relaxed. Trousers that hold their line.", image: CATEGORY_PHOTOS["trousers"], order: 3 },
  { name: "Denim", slug: "denim", description: "Rigid and washed denim in honest weights.", image: CATEGORY_PHOTOS["denim"], order: 4 },
  { name: "Dresses", slug: "dresses", description: "Slip, shirt and column dresses in fluid fabrics.", image: CATEGORY_PHOTOS["dresses"], order: 5 },
  { name: "Outerwear", slug: "outerwear", description: "Overshirts, chore jackets and coats built to layer.", image: CATEGORY_PHOTOS["outerwear"], order: 6 },
  { name: "Knitwear", slug: "knitwear", description: "Merino and cotton knits with soft structure.", image: CATEGORY_PHOTOS["knitwear"], order: 7 },
  { name: "Co-ords", slug: "co-ords", description: "Two pieces, one decision.", image: CATEGORY_PHOTOS["co-ords"], order: 8 },
];

export interface SeedProduct {
  name: string;
  slug: string;
  category: string;
  description: string;
  story?: string;
  price: number;
  compareAtPrice?: number;
  fabric: Fabric;
  material: string;
  fit: Fit;
  care: string[];
  gender: "men" | "women" | "unisex";
  colors: { name: string; hex: string }[];
  sizes: string[];
  images: string[];
  tags: string[];
  moods: MoodSlug[];
  occasions: string[];
  seasons: string[];
  featured?: boolean;
  stockPerVariant?: number;
  pairsWith?: string[];
  daysOld?: number;
}

const CARE_COTTON = ["Machine wash cold", "Wash inside out", "Line dry", "Warm iron"];
const CARE_LINEN = ["Machine wash cold, gentle", "Reshape while damp", "Line dry", "Iron while slightly damp"];
const CARE_WOOL = ["Hand wash cold or dry clean", "Dry flat", "Do not tumble dry", "Fold, never hang"];
const CARE_DENIM = ["Wash rarely, cold", "Wash inside out", "Line dry", "Do not bleach"];
const CARE_SILK = ["Dry clean only", "Cool iron on reverse", "Store away from light"];

const S = ["XS", "S", "M", "L", "XL"];
const SX = ["S", "M", "L", "XL", "XXL"];

export const PRODUCTS: SeedProduct[] = [
  // ── Shirts ───────────────────────────────────────────────────────────────
  {
    name: "Ash Linen Shirt", slug: "ash-linen-shirt", category: "shirts", price: 2490, compareAtPrice: 2990,
    description: "A relaxed linen shirt with a soft collar and a slightly dropped shoulder. Cut to be worn open over a tee or buttoned on its own.",
    story: "Woven in Kerala from European flax, the linen is pre-washed so it arrives already softened. The fabric wrinkles the way linen should, in a way that reads as ease rather than neglect.",
    fabric: "Linen", material: "100% European flax linen, 180 gsm", fit: "relaxed", care: CARE_LINEN, gender: "unisex",
    colors: [{ name: "Sand", hex: "#cbb89a" }, { name: "White", hex: "#f2f0ea" }, { name: "Black", hex: "#141414" }],
    sizes: S, images: PRODUCT_PHOTOS["ash-linen-shirt"],
    tags: ["linen", "shirt", "summer", "breathable", "relaxed"], moods: ["minimal", "weekend", "everyday"], occasions: ["brunch", "travel", "dinner"], seasons: ["summer", "spring"], featured: true, daysOld: 12,
  },
  {
    name: "Studio Poplin Shirt", slug: "studio-poplin-shirt", category: "shirts", price: 1990,
    description: "Crisp cotton poplin, a clean point collar and a straight hem. The shirt you wear when you want to look decided.",
    fabric: "Cotton", material: "100% long-staple cotton poplin", fit: "regular", care: CARE_COTTON, gender: "unisex",
    colors: [{ name: "White", hex: "#f4f3ef" }, { name: "Navy", hex: "#1c2234" }, { name: "Black", hex: "#111111" }],
    sizes: S, images: PRODUCT_PHOTOS["studio-poplin-shirt"],
    tags: ["poplin", "shirt", "crisp", "office", "formal"], moods: ["work", "minimal"], occasions: ["office", "dinner"], seasons: ["spring", "summer", "winter"], featured: true, daysOld: 40,
  },
  {
    name: "Oxford Overshirt", slug: "oxford-overshirt", category: "shirts", price: 2790,
    description: "A heavier oxford cut generously enough to layer. Two chest pockets, horn buttons, a hem that sits straight.",
    fabric: "Cotton", material: "100% cotton oxford, 240 gsm", fit: "oversized", care: CARE_COTTON, gender: "men",
    colors: [{ name: "Olive", hex: "#5b6142" }, { name: "Cream", hex: "#e9e2d1" }],
    sizes: SX, images: PRODUCT_PHOTOS["oxford-overshirt"],
    tags: ["oxford", "overshirt", "layer", "workwear"], moods: ["weekend", "everyday"], occasions: ["travel", "brunch"], seasons: ["winter", "spring", "monsoon"], daysOld: 90,
  },
  {
    name: "Column Silk Shirt", slug: "column-silk-shirt", category: "shirts", price: 4490,
    description: "Sand-washed silk with a fluid drape and a concealed placket. Wears quietly, moves well.",
    fabric: "Silk", material: "100% sand-washed mulberry silk", fit: "regular", care: CARE_SILK, gender: "women",
    colors: [{ name: "Ivory", hex: "#efe9dc" }, { name: "Black", hex: "#0f0f0f" }, { name: "Burgundy", hex: "#5a1f2a" }],
    sizes: S, images: PRODUCT_PHOTOS["column-silk-shirt"],
    tags: ["silk", "evening", "fluid", "elegant"], moods: ["statement", "work"], occasions: ["dinner", "evening", "office"], seasons: ["spring", "winter"], daysOld: 20,
  },
  {
    name: "Camp Collar Shirt", slug: "camp-collar-shirt", category: "shirts", price: 1890, compareAtPrice: 2290,
    description: "Open camp collar, boxy body, short sleeves with a clean hem. Made for heat.",
    fabric: "Cotton", material: "Cotton-linen blend, 60/40", fit: "relaxed", care: CARE_LINEN, gender: "men",
    colors: [{ name: "Sand", hex: "#d2c1a3" }, { name: "Sage", hex: "#9aa58a" }],
    sizes: SX, images: PRODUCT_PHOTOS["camp-collar-shirt"],
    tags: ["camp collar", "short sleeve", "summer", "holiday"], moods: ["weekend"], occasions: ["travel", "brunch"], seasons: ["summer"], daysOld: 15,
  },

  // ── T-Shirts ─────────────────────────────────────────────────────────────
  {
    name: "Heavyweight Tee", slug: "heavyweight-tee", category: "t-shirts", price: 990,
    description: "A 260 gsm cotton tee with a tighter neck rib and a squarer body. It holds its shape wash after wash.",
    story: "Knitted on old circular machines that produce a denser, more stable jersey. No side seams, so it drapes evenly.",
    fabric: "Cotton", material: "100% combed cotton jersey, 260 gsm", fit: "relaxed", care: CARE_COTTON, gender: "unisex",
    colors: [{ name: "White", hex: "#f5f5f2" }, { name: "Black", hex: "#121212" }, { name: "Grey", hex: "#8a8a86" }, { name: "Sand", hex: "#cfc2a9" }],
    sizes: S, images: PRODUCT_PHOTOS["heavyweight-tee"],
    tags: ["tee", "heavyweight", "basic", "essential"], moods: ["everyday", "minimal"], occasions: ["brunch", "travel", "gym"], seasons: ["summer", "spring", "monsoon"], featured: true, daysOld: 200,
  },
  {
    name: "Long Sleeve Rib Tee", slug: "long-sleeve-rib-tee", category: "t-shirts", price: 1290,
    description: "Fine rib cotton with a close fit through the body and a slightly longer sleeve.",
    fabric: "Knitted", material: "95% cotton, 5% elastane rib", fit: "slim", care: CARE_COTTON, gender: "women",
    colors: [{ name: "Cream", hex: "#ebe4d3" }, { name: "Black", hex: "#111111" }, { name: "Olive", hex: "#61684d" }],
    sizes: S, images: PRODUCT_PHOTOS["long-sleeve-rib-tee"],
    tags: ["rib", "long sleeve", "layering", "fitted"], moods: ["minimal", "everyday"], occasions: ["office", "brunch"], seasons: ["winter", "spring"], daysOld: 30,
  },
  {
    name: "Pocket Tee", slug: "pocket-tee", category: "t-shirts", price: 890,
    description: "A softer mid-weight jersey with a single chest pocket. The everyday version.",
    fabric: "Cotton", material: "100% organic cotton jersey, 200 gsm", fit: "regular", care: CARE_COTTON, gender: "unisex",
    colors: [{ name: "Navy", hex: "#1d2433" }, { name: "White", hex: "#f4f4f1" }, { name: "Rust", hex: "#9a4e2e" }],
    sizes: SX, images: PRODUCT_PHOTOS["pocket-tee"],
    tags: ["tee", "pocket", "organic", "basic"], moods: ["everyday", "weekend"], occasions: ["brunch", "travel"], seasons: ["summer", "spring"], daysOld: 120,
  },
  {
    name: "Boxy Cropped Tee", slug: "boxy-cropped-tee", category: "t-shirts", price: 1090,
    description: "Wide through the shoulder, cropped at the waist. Sits well over high-rise trousers.",
    fabric: "Cotton", material: "100% cotton slub jersey", fit: "oversized", care: CARE_COTTON, gender: "women",
    colors: [{ name: "White", hex: "#f6f5f1" }, { name: "Black", hex: "#141414" }],
    sizes: ["XS", "S", "M", "L"], images: PRODUCT_PHOTOS["boxy-cropped-tee"],
    tags: ["boxy", "cropped", "oversized"], moods: ["weekend", "statement"], occasions: ["brunch"], seasons: ["summer"], daysOld: 8,
  },

  // ── Trousers ─────────────────────────────────────────────────────────────
  {
    name: "Pleated Wool Trouser", slug: "pleated-wool-trouser", category: "trousers", price: 3990,
    description: "A single pleat, a high rise and a gentle taper. Tropical-weight wool that breathes.",
    story: "Cut from a cool-wool with enough body to hold the pleat and enough breathability to wear in Chennai in March.",
    fabric: "Wool", material: "100% tropical wool, 230 gsm", fit: "regular", care: CARE_WOOL, gender: "men",
    colors: [{ name: "Charcoal", hex: "#3a3a3d" }, { name: "Sand", hex: "#c5b394" }, { name: "Navy", hex: "#1b2130" }],
    sizes: SX, images: PRODUCT_PHOTOS["pleated-wool-trouser"],
    tags: ["pleated", "wool", "tailored", "trouser", "office"], moods: ["work", "minimal"], occasions: ["office", "dinner", "wedding"], seasons: ["winter", "spring"], featured: true, daysOld: 25,
  },
  {
    name: "Wide Leg Linen Trouser", slug: "wide-leg-linen-trouser", category: "trousers", price: 2690,
    description: "Full through the leg, elasticated at the back of the waist, with a drawcord you'll never see.",
    fabric: "Linen", material: "100% linen, 210 gsm", fit: "relaxed", care: CARE_LINEN, gender: "women",
    colors: [{ name: "Cream", hex: "#ebe5d6" }, { name: "Black", hex: "#141414" }, { name: "Olive", hex: "#6a6f52" }],
    sizes: S, images: PRODUCT_PHOTOS["wide-leg-linen-trouser"],
    tags: ["wide leg", "linen", "summer", "flowy"], moods: ["weekend", "minimal"], occasions: ["brunch", "travel", "dinner"], seasons: ["summer"], daysOld: 18,
  },
  {
    name: "Tapered Cotton Chino", slug: "tapered-cotton-chino", category: "trousers", price: 2190,
    description: "Garment-dyed twill with a mid rise and a leg that tapers without pinching.",
    fabric: "Cotton", material: "98% cotton, 2% elastane twill", fit: "slim", care: CARE_COTTON, gender: "men",
    colors: [{ name: "Sand", hex: "#cdb996" }, { name: "Olive", hex: "#5d6347" }, { name: "Navy", hex: "#1f2637" }],
    sizes: SX, images: PRODUCT_PHOTOS["tapered-cotton-chino"],
    tags: ["chino", "twill", "tapered", "smart casual"], moods: ["everyday", "work"], occasions: ["office", "brunch", "travel"], seasons: ["spring", "winter", "monsoon"], daysOld: 60,
  },
  {
    name: "Drawstring Easy Trouser", slug: "drawstring-easy-trouser", category: "trousers", price: 1790,
    description: "Soft brushed cotton with an elasticated waist and a straight leg. For long days and longer flights.",
    fabric: "Cotton", material: "100% brushed cotton twill", fit: "relaxed", care: CARE_COTTON, gender: "unisex",
    colors: [{ name: "Grey", hex: "#7c7b78" }, { name: "Black", hex: "#131313" }],
    sizes: SX, images: PRODUCT_PHOTOS["drawstring-easy-trouser"],
    tags: ["drawstring", "easy", "comfortable", "travel", "lounge"], moods: ["weekend", "everyday"], occasions: ["travel"], seasons: ["winter", "monsoon"], daysOld: 75,
  },

  // ── Denim ────────────────────────────────────────────────────────────────
  {
    name: "Rigid Straight Jean", slug: "rigid-straight-jean", category: "denim", price: 3290,
    description: "13.5 oz rigid selvedge, a true straight leg and a mid rise. It will take a month to break in and a decade to wear out.",
    fabric: "Denim", material: "100% cotton selvedge denim, 13.5 oz", fit: "regular", care: CARE_DENIM, gender: "men",
    colors: [{ name: "Indigo", hex: "#1f2a44" }, { name: "Black", hex: "#161616" }],
    sizes: SX, images: PRODUCT_PHOTOS["rigid-straight-jean"],
    tags: ["selvedge", "rigid", "straight", "raw denim"], moods: ["everyday", "weekend"], occasions: ["brunch", "travel"], seasons: ["winter", "spring", "monsoon"], featured: true, daysOld: 150,
  },
  {
    name: "Washed Wide Jean", slug: "washed-wide-jean", category: "denim", price: 2990, compareAtPrice: 3490,
    description: "A softer, stone-washed denim with a high rise and a wide, cropped leg.",
    fabric: "Denim", material: "100% cotton denim, 12 oz", fit: "relaxed", care: CARE_DENIM, gender: "women",
    colors: [{ name: "Light Blue", hex: "#8ea3bf" }, { name: "Ecru", hex: "#e7e1d2" }],
    sizes: S, images: PRODUCT_PHOTOS["washed-wide-jean"],
    tags: ["wide leg", "washed", "high rise", "cropped"], moods: ["weekend", "statement"], occasions: ["brunch"], seasons: ["summer", "spring"], daysOld: 10,
  },
  {
    name: "Slim Black Jean", slug: "slim-black-jean", category: "denim", price: 2490,
    description: "Comfort-stretch black denim that stays black. Slim, not skinny.",
    fabric: "Denim", material: "98% cotton, 2% elastane, 11 oz", fit: "slim", care: CARE_DENIM, gender: "unisex",
    colors: [{ name: "Black", hex: "#111111" }],
    sizes: SX, images: PRODUCT_PHOTOS["slim-black-jean"],
    tags: ["black denim", "slim", "stretch"], moods: ["minimal", "statement", "everyday"], occasions: ["evening", "dinner"], seasons: ["winter", "spring", "monsoon"], daysOld: 45,
  },

  // ── Dresses ──────────────────────────────────────────────────────────────
  {
    name: "Bias Slip Dress", slug: "bias-slip-dress", category: "dresses", price: 3890,
    description: "Cut on the bias so it skims rather than clings. Thin adjustable straps, a midi length, nothing else.",
    story: "The bias cut is unforgiving to make and forgiving to wear. Each panel is cut at 45° to the grain, which is what gives the fabric its fluid fall.",
    fabric: "Silk", material: "100% silk satin", fit: "slim", care: CARE_SILK, gender: "women",
    colors: [{ name: "Black", hex: "#0f0f0f" }, { name: "Champagne", hex: "#e2d3b8" }, { name: "Burgundy", hex: "#5c1f2c" }],
    sizes: S, images: PRODUCT_PHOTOS["bias-slip-dress"],
    tags: ["slip", "bias", "silk", "midi", "evening"], moods: ["statement"], occasions: ["dinner", "evening", "wedding"], seasons: ["summer", "spring"], featured: true, daysOld: 14,
  },
  {
    name: "Linen Shirt Dress", slug: "linen-shirt-dress", category: "dresses", price: 2990,
    description: "A shirt, lengthened. Belted or unbelted, buttoned or open over trousers.",
    fabric: "Linen", material: "100% linen", fit: "relaxed", care: CARE_LINEN, gender: "women",
    colors: [{ name: "White", hex: "#f3f1ea" }, { name: "Sand", hex: "#cfbd9d" }, { name: "Black", hex: "#141414" }],
    sizes: S, images: PRODUCT_PHOTOS["linen-shirt-dress"],
    tags: ["shirt dress", "linen", "summer", "versatile"], moods: ["everyday", "minimal", "weekend"], occasions: ["brunch", "travel", "office"], seasons: ["summer"], daysOld: 22,
  },
  {
    name: "Knit Column Dress", slug: "knit-column-dress", category: "dresses", price: 3490,
    description: "A fine merino rib that falls straight from a high neck. Warm without weight.",
    fabric: "Knitted", material: "100% extra-fine merino wool", fit: "slim", care: CARE_WOOL, gender: "women",
    colors: [{ name: "Charcoal", hex: "#3b3b3e" }, { name: "Cream", hex: "#ebe6d9" }],
    sizes: S, images: PRODUCT_PHOTOS["knit-column-dress"],
    tags: ["knit", "merino", "column", "winter"], moods: ["minimal", "work", "statement"], occasions: ["office", "dinner", "evening"], seasons: ["winter"], daysOld: 5,
  },

  // ── Outerwear ────────────────────────────────────────────────────────────
  {
    name: "Chore Jacket", slug: "chore-jacket", category: "outerwear", price: 4290,
    description: "Three patch pockets, a soft collar, and a moleskin cotton that ages like a good pair of boots.",
    fabric: "Cotton", material: "100% cotton moleskin, 320 gsm", fit: "regular", care: CARE_COTTON, gender: "unisex",
    colors: [{ name: "Olive", hex: "#4f5540" }, { name: "Navy", hex: "#1a2030" }, { name: "Sand", hex: "#c8b697" }],
    sizes: SX, images: PRODUCT_PHOTOS["chore-jacket"],
    tags: ["chore", "jacket", "workwear", "layer", "moleskin"], moods: ["everyday", "weekend"], occasions: ["travel", "brunch"], seasons: ["winter", "monsoon", "spring"], featured: true, daysOld: 35,
  },
  {
    name: "Unstructured Blazer", slug: "unstructured-blazer", category: "outerwear", price: 6490, compareAtPrice: 7490,
    description: "No padding, half-lined, patch pockets. A blazer that behaves like a cardigan.",
    fabric: "Wool", material: "Wool-linen hopsack, 55/45", fit: "regular", care: CARE_WOOL, gender: "men",
    colors: [{ name: "Charcoal", hex: "#38383b" }, { name: "Sand", hex: "#c9b797" }],
    sizes: SX, images: PRODUCT_PHOTOS["unstructured-blazer"],
    tags: ["blazer", "unstructured", "tailoring", "smart"], moods: ["work", "statement"], occasions: ["office", "wedding", "dinner"], seasons: ["winter", "spring"], daysOld: 28,
  },
  {
    name: "Denim Trucker Jacket", slug: "denim-trucker-jacket", category: "outerwear", price: 3690,
    description: "Classic proportions in a 12 oz washed denim. Slightly cropped so it sits right over everything.",
    fabric: "Denim", material: "100% cotton denim, 12 oz", fit: "regular", care: CARE_DENIM, gender: "unisex",
    colors: [{ name: "Indigo", hex: "#24304a" }, { name: "Ecru", hex: "#e5dfd0" }],
    sizes: SX, images: PRODUCT_PHOTOS["denim-trucker-jacket"],
    tags: ["trucker", "denim jacket", "layer"], moods: ["weekend", "everyday"], occasions: ["brunch", "travel"], seasons: ["winter", "spring"], daysOld: 80,
  },
  {
    name: "Wool Overcoat", slug: "wool-overcoat", category: "outerwear", price: 8990,
    description: "A single-breasted overcoat that ends just above the knee. Clean, quiet, warm.",
    fabric: "Wool", material: "80% wool, 20% cashmere melton", fit: "regular", care: CARE_WOOL, gender: "unisex",
    colors: [{ name: "Camel", hex: "#b48f5e" }, { name: "Black", hex: "#111111" }, { name: "Charcoal", hex: "#3a3a3d" }],
    sizes: SX, images: PRODUCT_PHOTOS["wool-overcoat"],
    tags: ["overcoat", "wool", "cashmere", "winter", "coat"], moods: ["minimal", "work", "statement"], occasions: ["office", "evening", "travel"], seasons: ["winter"], daysOld: 7,
  },

  // ── Knitwear ─────────────────────────────────────────────────────────────
  {
    name: "Merino Crew Neck", slug: "merino-crew-neck", category: "knitwear", price: 2990,
    description: "A fine-gauge merino crew you can wear under a jacket or over a shirt. The most useful thing in the wardrobe.",
    fabric: "Knitted", material: "100% extra-fine merino wool", fit: "regular", care: CARE_WOOL, gender: "unisex",
    colors: [{ name: "Charcoal", hex: "#3b3b3e" }, { name: "Cream", hex: "#ebe6d9" }, { name: "Navy", hex: "#1c2233" }, { name: "Olive", hex: "#5b6148" }],
    sizes: S, images: PRODUCT_PHOTOS["merino-crew-neck"],
    tags: ["merino", "crew neck", "knit", "layering", "essential"], moods: ["everyday", "work", "minimal"], occasions: ["office", "travel", "dinner"], seasons: ["winter", "spring"], featured: true, daysOld: 50,
  },
  {
    name: "Cotton Rib Cardigan", slug: "cotton-rib-cardigan", category: "knitwear", price: 2690,
    description: "Chunky cotton rib, shell buttons, a slightly cropped body. Softer than it looks.",
    fabric: "Knitted", material: "100% cotton, 7-gauge rib", fit: "relaxed", care: CARE_COTTON, gender: "women",
    colors: [{ name: "Oat", hex: "#d9cfbc" }, { name: "Black", hex: "#141414" }],
    sizes: S, images: PRODUCT_PHOTOS["cotton-rib-cardigan"],
    tags: ["cardigan", "rib", "cotton knit", "cropped"], moods: ["weekend", "everyday"], occasions: ["brunch", "travel"], seasons: ["winter", "spring", "monsoon"], daysOld: 33,
  },
  {
    name: "Oversized Wool Hoodie", slug: "oversized-wool-hoodie", category: "knitwear", price: 3990,
    description: "A knitted hoodie in a soft lambswool blend. Dropped shoulders, deep kangaroo pocket.",
    fabric: "Wool", material: "70% lambswool, 30% nylon", fit: "oversized", care: CARE_WOOL, gender: "unisex",
    colors: [{ name: "Grey", hex: "#7d7c79" }, { name: "Black", hex: "#141414" }],
    sizes: SX, images: PRODUCT_PHOTOS["oversized-wool-hoodie"],
    tags: ["hoodie", "wool", "oversized", "cosy"], moods: ["weekend"], occasions: ["travel"], seasons: ["winter"], daysOld: 3,
  },

  // ── Co-ords ──────────────────────────────────────────────────────────────
  {
    name: "Linen Co-ord Set", slug: "linen-co-ord-set", category: "co-ords", price: 4690, compareAtPrice: 5290,
    description: "A camp collar shirt and a wide, drawstring trouser in the same washed linen. Wear together, or don't.",
    fabric: "Linen", material: "100% washed linen", fit: "relaxed", care: CARE_LINEN, gender: "unisex",
    colors: [{ name: "Sand", hex: "#cbb999" }, { name: "White", hex: "#f2f0ea" }, { name: "Olive", hex: "#6a6f52" }],
    sizes: S, images: PRODUCT_PHOTOS["linen-co-ord-set"],
    tags: ["co-ord", "set", "linen", "holiday", "summer"], moods: ["weekend", "minimal"], occasions: ["travel", "brunch", "dinner"], seasons: ["summer"], featured: true, daysOld: 9,
  },
  {
    name: "Knit Lounge Set", slug: "knit-lounge-set", category: "co-ords", price: 3890,
    description: "A ribbed tank and a matching wide trouser in a soft viscose-blend knit. Airport to dinner.",
    fabric: "Knitted", material: "Viscose-nylon rib knit", fit: "relaxed", care: CARE_WOOL, gender: "women",
    colors: [{ name: "Black", hex: "#141414" }, { name: "Cream", hex: "#ece6d8" }],
    sizes: S, images: PRODUCT_PHOTOS["knit-lounge-set"],
    tags: ["lounge", "knit set", "co-ord", "travel"], moods: ["weekend", "minimal"], occasions: ["travel", "dinner"], seasons: ["spring", "summer", "winter"], daysOld: 16,
  },
];

// Curated "pairs well with" links, by slug.
export const PAIRS: Record<string, string[]> = {
  "ash-linen-shirt": ["wide-leg-linen-trouser", "tapered-cotton-chino", "rigid-straight-jean"],
  "studio-poplin-shirt": ["pleated-wool-trouser", "unstructured-blazer"],
  "heavyweight-tee": ["rigid-straight-jean", "chore-jacket", "drawstring-easy-trouser"],
  "pleated-wool-trouser": ["studio-poplin-shirt", "merino-crew-neck", "unstructured-blazer"],
  "rigid-straight-jean": ["heavyweight-tee", "oxford-overshirt", "chore-jacket"],
  "bias-slip-dress": ["wool-overcoat", "cotton-rib-cardigan"],
  "chore-jacket": ["heavyweight-tee", "rigid-straight-jean"],
  "merino-crew-neck": ["pleated-wool-trouser", "slim-black-jean"],
  "wool-overcoat": ["merino-crew-neck", "knit-column-dress", "pleated-wool-trouser"],
  "linen-co-ord-set": ["heavyweight-tee"],
};

export const REVIEWS: { slug: string; rating: number; title: string; body: string }[] = [
  { slug: "ash-linen-shirt", rating: 5, title: "Exactly as described", body: "The linen is properly softened out of the packet. I ordered the sand in M and it fits relaxed without being sloppy. Wore it through a Chennai afternoon without regret." },
  { slug: "ash-linen-shirt", rating: 4, title: "Great, runs a touch long", body: "Beautiful fabric and colour. The body is a little longer than I expected, which works untucked but not tucked." },
  { slug: "heavyweight-tee", rating: 5, title: "The tee", body: "Thick, structured, doesn't twist after washing. I have four now." },
  { slug: "heavyweight-tee", rating: 4, title: "Solid", body: "Good weight. Neck rib is snug at first and relaxes after two washes." },
  { slug: "pleated-wool-trouser", rating: 5, title: "Best trouser I own", body: "Breathable for wool, holds the crease, and the taper is right. Sized up one for comfort at the waist." },
  { slug: "rigid-straight-jean", rating: 4, title: "Stiff, then perfect", body: "Two weeks of stiffness, then they moulded. Honest denim." },
  { slug: "bias-slip-dress", rating: 5, title: "Moves beautifully", body: "The bias cut does what it promises. Champagne is more muted in person, in a good way." },
  { slug: "merino-crew-neck", rating: 5, title: "Wear it weekly", body: "Fine enough for under a blazer, warm enough alone. No pilling after a season." },
  { slug: "chore-jacket", rating: 4, title: "Great layer", body: "Moleskin is soft and heavy. Pockets are deep. Sleeves slightly long for me at 5'8''." },
  { slug: "studio-poplin-shirt", rating: 4, title: "Crisp", body: "Sharp collar, good length. Needs ironing, as poplin does." },
];
