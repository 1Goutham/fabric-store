import { describe, expect, it } from "vitest";
import { CATEGORY_PHOTOS, PRODUCT_PHOTOS, categoryImage, lineImage, productImages } from "@/lib/data/catalogue-images";

const OLD_DEMO = "https://images.unsplash.com/photo-1594938298603-c8148c4b3e2c?auto=format&fit=crop&w=1400&q=80"; // dead link from the first seed
const ADMIN = "https://res.cloudinary.com/demo/image/upload/shirt.jpg";

describe("catalogue images", () => {
  it("replaces missing or demo-seeded product photos with the curated set", () => {
    expect(productImages("heavyweight-tee", "Heavyweight Tee", []).map((i) => i.url)).toEqual(PRODUCT_PHOTOS["heavyweight-tee"]);
    expect(productImages("heavyweight-tee", "Heavyweight Tee", null).length).toBe(PRODUCT_PHOTOS["heavyweight-tee"].length);
    expect(productImages("pleated-wool-trouser", "Pleated Wool Trouser", [{ url: OLD_DEMO }])[0].url).toBe(PRODUCT_PHOTOS["pleated-wool-trouser"][0]);
  });

  it("keeps images an admin added", () => {
    expect(productImages("heavyweight-tee", "Heavyweight Tee", [{ url: ADMIN }, { url: OLD_DEMO }]).map((i) => i.url)).toEqual([ADMIN, OLD_DEMO]);
  });

  it("leaves products outside the catalogue alone", () => {
    expect(productImages("admin-made", "New", [])).toEqual([]);
    expect(productImages("admin-made", "New", [{ url: OLD_DEMO }])[0].url).toBe(OLD_DEMO);
  });

  it("applies the same rule to categories and order lines", () => {
    expect(categoryImage("knitwear", null)).toBe(CATEGORY_PHOTOS.knitwear);
    expect(categoryImage("knitwear", ADMIN)).toBe(ADMIN);
    expect(categoryImage("other", null)).toBeNull();
    expect(lineImage("wool-overcoat", OLD_DEMO)).toBe(PRODUCT_PHOTOS["wool-overcoat"][0]);
    expect(lineImage("wool-overcoat", ADMIN)).toBe(ADMIN);
  });

  it("covers every catalogue product and category with a photo", () => {
    expect(Object.keys(PRODUCT_PHOTOS)).toHaveLength(28);
    expect(Object.keys(CATEGORY_PHOTOS)).toHaveLength(8);
    for (const urls of Object.values(PRODUCT_PHOTOS)) expect(urls.length).toBeGreaterThan(0);
  });
});
