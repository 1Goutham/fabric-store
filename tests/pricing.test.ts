import { describe, it, expect } from "vitest";
import { computePricing, discountPercent, formatPrice } from "@/lib/commerce/pricing";
import { slugify, orderNumber } from "@/lib/commerce/slug";

describe("computePricing", () => {
  it("charges nothing for an empty bag", () => expect(computePricing(0)).toEqual({ subtotal: 0, shipping: 0, tax: 0, total: 0 }));
  it("gives free standard delivery over the threshold", () => {
    const p = computePricing(2490, "standard");
    expect(p.shipping).toBe(0);
    expect(p.tax).toBe(Math.round(2490 * 0.05));
    expect(p.total).toBe(2490 + p.tax);
  });
  it("charges express delivery regardless of subtotal", () => expect(computePricing(9000, "express").shipping).toBe(249));
});

describe("helpers", () => {
  it("formats INR", () => expect(formatPrice(2490)).toContain("2,490"));
  it("computes discount", () => expect(discountPercent(2490, 2990)).toBe(17));
  it("returns null without a real discount", () => expect(discountPercent(2490, 2000)).toBeNull());
  it("slugifies", () => expect(slugify("Ash  Linen Shirt!")).toBe("ash-linen-shirt"));
  it("makes order numbers", () => expect(orderNumber()).toMatch(/^FN-[A-Z2-9]{6}$/));
});
