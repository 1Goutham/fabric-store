import { describe, it, expect } from "vitest";
import { parseIntentRules, parsePrice, describeIntent } from "@/lib/intelligence/intent";

describe("parsePrice", () => {
  it("reads 'under ₹2,000'", () => expect(parsePrice("minimal black shirt under ₹2,000")).toEqual({ min: null, max: 2000 }));
  it("reads 'under 2k'", () => expect(parsePrice("something under 2k")).toEqual({ min: null, max: 2000 }));
  it("reads 'between 1000 and 3000'", () => expect(parsePrice("between 1000 and 3000")).toEqual({ min: 1000, max: 3000 }));
  it("reads 'around 1500' as a band", () => expect(parsePrice("around 1500")).toEqual({ min: 1200, max: 1800 }));
  it("reads 'over 5000'", () => expect(parsePrice("coats over 5000")).toEqual({ min: 5000, max: null }));
  it("ignores tiny numbers", () => expect(parsePrice("2 shirts")).toEqual({ min: null, max: null }));
});

describe("parseIntentRules", () => {
  it("understands a full natural-language request", () => {
    const i = parseIntentRules("I need a minimal black shirt under ₹2,000.");
    expect(i.categories).toEqual(["shirts"]);
    expect(i.colors).toEqual(["black"]);
    expect(i.moods).toContain("minimal");
    expect(i.priceMax).toBe(2000);
    expect(i.keywords).toEqual([]);
  });
  it("maps occasions and seasons", () => {
    const i = parseIntentRules("Something relaxed for a summer day");
    expect(i.seasons).toContain("summer");
    expect(i.fits).toContain("relaxed");
    expect(i.moods).toContain("weekend");
  });
  it("maps a dinner to the statement mood", () => {
    const i = parseIntentRules("Find something for a casual dinner");
    expect(i.occasions).toContain("dinner");
    expect(i.moods).toContain("statement");
  });
  it("detects sizes only when explicit", () => {
    expect(parseIntentRules("linen shirt in medium").sizes).toEqual(["M"]);
    expect(parseIntentRules("shirt size L").sizes).toEqual(["L"]);
    expect(parseIntentRules("a small dinner").sizes).toEqual(["S"]);
  });
  it("detects gender and sort", () => {
    const i = parseIntentRules("cheapest jeans for men");
    expect(i.categories).toContain("denim");
    expect(i.gender).toBe("men");
    expect(i.sort).toBe("price-asc");
  });
  it("leaves unknown words as keywords", () => {
    const i = parseIntentRules("houndstooth blazer");
    expect(i.categories).toEqual(["outerwear"]);
    expect(i.keywords).toEqual(["houndstooth"]);
  });
  it("describes itself", () => {
    expect(describeIntent(parseIntentRules("black linen shirt under 2000 for work"))).toBe("Black linen shirts · under ₹2,000 · work · for office");
  });
});
