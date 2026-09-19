/**
 * Integration tests against a real MongoDB (MONGODB_URI). They exercise the
 * service layer end to end: catalogue → cart → checkout → order → reviews.
 * Skipped automatically when no database is reachable.
 */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import mongoose from "mongoose";
import { hashPassword } from "@/lib/auth/password";

const uri = process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/fabricnest_test";
let available = false;
try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 1500 });
  available = true;
} catch {
  available = false;
}

const d = available ? describe : describe.skip;

d("commerce flow", () => {
  let userId = "";
  let productId = "";
  let color = "";
  let size = "";

  beforeAll(async () => {
    process.env.MONGODB_URI = uri;
    const { User } = await import("@/lib/models/User");
    const { Product } = await import("@/lib/models/Product");
    const { Category } = await import("@/lib/models/Category");
    await Promise.all([User.deleteMany({ email: /test-flow/ }), Product.deleteMany({ slug: /^test-flow/ }), Category.deleteMany({ slug: "test-flow-cat" })]);
    const user = await User.create({ name: "Flow Tester", email: `test-flow-${Date.now()}@example.com`, passwordHash: await hashPassword("password123"), role: "customer" });
    userId = user._id.toString();
    const cat = await Category.create({ name: "Test Flow", slug: "test-flow-cat" });
    const product = await Product.create({
      name: "Test Flow Shirt", slug: `test-flow-shirt-${Date.now()}`, description: "A shirt used only by the integration tests.", price: 1500, category: cat._id, categorySlug: cat.slug, fabric: "Linen",
      colors: [{ name: "Black", hex: "#000000" }], sizes: ["M", "L"], variants: [{ sku: "TF-B-M", color: "Black", size: "M", stock: 2 }, { sku: "TF-B-L", color: "Black", size: "L", stock: 0 }], moods: ["minimal"], tags: ["test"], status: "active",
    });
    productId = product._id.toString();
    color = "Black";
    size = "M";
  });

  afterAll(async () => {
    if (!available) return;
    const { User } = await import("@/lib/models/User");
    const { Product } = await import("@/lib/models/Product");
    const { Category } = await import("@/lib/models/Category");
    const { Order } = await import("@/lib/models/Order");
    const { Checkout } = await import("@/lib/models/Checkout");
    const { Cart } = await import("@/lib/models/Cart");
    await Promise.all([User.deleteMany({ email: /test-flow/ }), Product.deleteMany({ slug: /^test-flow/ }), Category.deleteMany({ slug: "test-flow-cat" }), Order.deleteMany({ user: userId }), Checkout.deleteMany({ user: userId }), Cart.deleteMany({ user: userId })]);
    await mongoose.disconnect();
  });

  it("adds to the cart with server-side pricing and stock caps", async () => {
    const { addToCart } = await import("@/lib/commerce/cart");
    const cart = await addToCart(userId, { productId, color, size, quantity: 5 });
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(2); // capped to stock
    expect(cart.items[0].unitPrice).toBe(1500);
    expect(cart.subtotal).toBe(3000);
  });

  it("refuses a sold-out size", async () => {
    const { addToCart } = await import("@/lib/commerce/cart");
    await expect(addToCart(userId, { productId, color, size: "L", quantity: 1 })).rejects.toMatchObject({ status: 409 });
  });

  it("creates an order only after payment, decrements stock, clears the cart, and is idempotent", async () => {
    const { beginCheckout, finalizeOrder } = await import("@/lib/commerce/checkout");
    const { getCartSummary } = await import("@/lib/commerce/cart");
    const { Product } = await import("@/lib/models/Product");
    const address = { fullName: "Flow Tester", line1: "1 Test St", city: "Chennai", state: "TN", postalCode: "600001", country: "India", phone: "9999999999" };
    const { checkoutId, provider } = await beginCheckout(userId, { address, deliveryMethod: "express" });
    expect(provider).toBe("test");

    const before = await Product.findById(productId).lean();
    expect(before!.stock).toBe(2);
    const order = await finalizeOrder(checkoutId, { sessionId: `test_${checkoutId}` });
    expect(order.orderNumber).toMatch(/^FN-/);
    expect(order.pricing.total).toBe(3000 + 249 + 150);
    expect(order.status).toBe("confirmed");

    const after = await Product.findById(productId).lean();
    expect(after!.stock).toBe(0);
    expect(after!.variants.find((v) => v.size === "M")!.stock).toBe(0);
    expect((await getCartSummary(userId)).items).toHaveLength(0);

    const again = await finalizeOrder(checkoutId, { sessionId: `test_${checkoutId}` });
    expect(again._id.toString()).toBe(order._id.toString());
    expect(await Product.findById(productId).lean().then((p) => p!.stock)).toBe(0);
  });

  it("marks a review as a verified purchase and updates the rating", async () => {
    const { upsertReview, listReviews } = await import("@/lib/commerce/reviews");
    const { Product } = await import("@/lib/models/Product");
    const review = await upsertReview(userId, productId, { rating: 4, body: "Wears well, honest fabric." });
    expect(review.verifiedPurchase).toBe(true);
    const p = await Product.findById(productId).lean();
    expect(p!.rating!.average).toBe(4);
    expect(p!.rating!.count).toBe(1);
    expect(await listReviews(productId, userId)).toHaveLength(1);
  });

  it("enforces order status transitions", async () => {
    const { Order } = await import("@/lib/models/Order");
    const { adminUpdateOrderStatus } = await import("@/lib/commerce/orders");
    const o = await Order.findOne({ user: userId }).lean();
    await expect(adminUpdateOrderStatus(o!._id.toString(), "delivered")).rejects.toMatchObject({ status: 400 });
    const updated = await adminUpdateOrderStatus(o!._id.toString(), "processing");
    expect(updated.status).toBe("processing");
  });

  it("personalises recommendations from signals", async () => {
    const { recordProductSignal, getStyleProfile } = await import("@/lib/intelligence/preferences");
    const { recommendForUser } = await import("@/lib/intelligence/recommend");
    await recordProductSignal(userId, productId, "view");
    const profile = await getStyleProfile(userId);
    expect(profile.hasSignals).toBe(true);
    expect(profile.categories).toContain("test-flow-cat");
    const recs = await recommendForUser(userId, { limit: 4 });
    expect(recs.personalised).toBe(true);
  });

  it("discovers with relaxation and honest notes", async () => {
    const { discover } = await import("@/lib/intelligence/discover");
    const { parseIntentRules } = await import("@/lib/intelligence/intent");
    const r = await discover(parseIntentRules("minimal linen shirt under 2000"), { limit: 8 });
    expect(r.products.length).toBeGreaterThan(0);
    const tight = await discover(parseIntentRules("linen shirt under 100"), { limit: 8 });
    // price < 100 is ignored by the parser; make sure something sensible comes back
    expect(tight.products.length).toBeGreaterThan(0);
  });
});
