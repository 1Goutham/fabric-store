/**
 * Seed the database: categories, products, an admin, demo customers, reviews,
 * and a few historical orders so the admin dashboard has data.
 *
 *   npm run seed            # upserts catalogue, keeps existing users/orders
 *   npm run seed -- --reset # wipes catalogue, users, carts, wishlists, orders
 */
import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { CATEGORIES, PAIRS, PRODUCTS, REVIEWS } from "./seed-data";
import { Category } from "@/lib/models/Category";
import { Product } from "@/lib/models/Product";
import { User } from "@/lib/models/User";
import { Review } from "@/lib/models/Review";
import { Order } from "@/lib/models/Order";
import { Cart } from "@/lib/models/Cart";
import { Wishlist } from "@/lib/models/Wishlist";
import { UserPreference } from "@/lib/models/UserPreference";
import { Checkout } from "@/lib/models/Checkout";
import { computePricing } from "@/lib/commerce/pricing";
import { orderNumber, slugify } from "@/lib/commerce/slug";

const reset = process.argv.includes("--reset");

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  await mongoose.connect(uri);
  console.log("connected");

  if (reset) {
    await Promise.all([Category.deleteMany({}), Product.deleteMany({}), User.deleteMany({}), Review.deleteMany({}), Order.deleteMany({}), Cart.deleteMany({}), Wishlist.deleteMany({}), UserPreference.deleteMany({}), Checkout.deleteMany({})]);
    console.log("cleared");
  }

  // Users
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@fabricnest.app";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "admin12345";
  const admin = await User.findOneAndUpdate(
    { email: adminEmail },
    { $setOnInsert: { name: "Goutham", email: adminEmail, passwordHash: await bcrypt.hash(adminPassword, 12), role: "admin" } },
    { upsert: true, new: true }
  );
  const demoUsers = [
    { name: "Aarav Menon", email: "aarav@example.com" },
    { name: "Meera Iyer", email: "meera@example.com" },
    { name: "Rohan Das", email: "rohan@example.com" },
  ];
  const customers = [];
  for (const d of demoUsers) {
    customers.push(
      await User.findOneAndUpdate(
        { email: d.email },
        { $setOnInsert: { ...d, passwordHash: await bcrypt.hash("password123", 12), role: "customer", addresses: [{ label: "Home", fullName: d.name, line1: "12 Cathedral Road", city: "Chennai", state: "Tamil Nadu", postalCode: "600086", country: "India", phone: "+91 98400 00000", isDefault: true }] } },
        { upsert: true, new: true }
      )
    );
  }

  // Categories
  const catBySlug = new Map<string, mongoose.Types.ObjectId>();
  for (const c of CATEGORIES) {
    const doc = await Category.findOneAndUpdate({ slug: c.slug }, { $set: c }, { upsert: true, new: true });
    catBySlug.set(c.slug, doc._id);
  }

  // Products
  const prodBySlug = new Map<string, mongoose.Types.ObjectId>();
  for (const p of PRODUCTS) {
    const variants = p.colors.flatMap((c) =>
      p.sizes.map((size, i) => ({
        sku: `${p.slug}-${slugify(c.name)}-${size.toLowerCase()}`.toUpperCase(),
        color: c.name,
        size,
        // Vary stock so low-stock and sold-out states exist in the demo.
        stock: p.stockPerVariant ?? (i === p.sizes.length - 1 && c === p.colors[0] ? 0 : i === 0 ? 2 : 8 + ((i * 7 + c.name.length) % 9)),
      }))
    );
    const createdAt = new Date(Date.now() - (p.daysOld ?? 30) * 86400000);
    const doc = await Product.findOneAndUpdate(
      { slug: p.slug },
      {
        $set: {
          name: p.name, description: p.description, story: p.story, price: p.price, compareAtPrice: p.compareAtPrice, currency: "INR",
          category: catBySlug.get(p.category), categorySlug: p.category, fabric: p.fabric, material: p.material, fit: p.fit, care: p.care, gender: p.gender,
          colors: p.colors, sizes: p.sizes, variants, stock: variants.reduce((s, v) => s + v.stock, 0),
          images: p.images.map((url, i) => ({ url, alt: `${p.name}${i ? ", alternate view" : ""}` })),
          tags: p.tags, moods: p.moods, occasions: p.occasions, seasons: p.seasons, featured: Boolean(p.featured), status: "active",
          salesCount: Math.floor(((p.name.length * 13) % 40) + (p.featured ? 20 : 0)), viewCount: Math.floor((p.name.length * 97) % 900),
        },
        $setOnInsert: { createdAt },
      },
      { upsert: true, new: true, timestamps: false }
    );
    // Force createdAt (timestamps: false above keeps upsert from stamping now).
    await Product.collection.updateOne({ _id: doc._id }, { $set: { createdAt, updatedAt: new Date() } });
    prodBySlug.set(p.slug, doc._id);
  }
  for (const [slug, pairs] of Object.entries(PAIRS)) {
    await Product.updateOne({ slug }, { $set: { pairsWith: pairs.map((s) => prodBySlug.get(s)).filter(Boolean) } });
  }

  // Reviews (round-robin across demo customers)
  let i = 0;
  for (const r of REVIEWS) {
    const user = customers[i++ % customers.length];
    const product = prodBySlug.get(r.slug);
    if (!product) continue;
    await Review.findOneAndUpdate({ product, user: user._id }, { $set: { rating: r.rating, title: r.title, body: r.body, verifiedPurchase: true } }, { upsert: true });
  }
  for (const productId of prodBySlug.values()) {
    const [agg] = await Review.aggregate<{ avg: number; count: number }>([{ $match: { product: productId } }, { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } }]);
    await Product.updateOne({ _id: productId }, { $set: { "rating.average": Math.round((agg?.avg ?? 0) * 10) / 10, "rating.count": agg?.count ?? 0 } });
  }

  // Historical orders (only when none exist) so analytics have something to show.
  if ((await Order.countDocuments()) === 0) {
    const all = await Product.find({ status: "active" }).lean();
    const statuses = ["delivered", "delivered", "shipped", "processing", "confirmed", "delivered", "cancelled"] as const;
    for (let n = 0; n < 14; n++) {
      const user = customers[n % customers.length];
      const picks = [all[(n * 3) % all.length], all[(n * 5 + 1) % all.length]].filter((p, idx, arr) => arr.indexOf(p) === idx);
      const items = picks.map((p) => ({
        product: p._id, name: p.name, slug: p.slug, image: p.images[0]?.url ?? "", color: p.colors[0].name, size: p.sizes[1] ?? p.sizes[0],
        sku: p.variants[1]?.sku, unitPrice: p.price, quantity: 1 + (n % 2), lineTotal: p.price * (1 + (n % 2)),
      }));
      const subtotal = items.reduce((s, it) => s + it.lineTotal, 0);
      const pricing = computePricing(subtotal, n % 4 === 0 ? "express" : "standard");
      const createdAt = new Date(Date.now() - (n * 2 + 1) * 86400000);
      const status = statuses[n % statuses.length];
      await Order.create({
        orderNumber: orderNumber(), user: user._id, items, shippingAddress: user.addresses[0], deliveryMethod: n % 4 === 0 ? "express" : "standard",
        pricing: { ...pricing, currency: "INR" }, payment: { provider: "test", sessionId: `seed_${n}_${Date.now()}`, status: "paid" }, status,
        timeline: [{ status: "confirmed", at: createdAt, note: "Payment received" }, ...(status !== "confirmed" ? [{ status, at: new Date(createdAt.getTime() + 86400000) }] : [])],
        paidAt: createdAt, createdAt, updatedAt: createdAt, ...(status === "delivered" ? { deliveredAt: new Date(createdAt.getTime() + 3 * 86400000) } : {}),
      });
    }
  }

  await Product.syncIndexes();
  await Review.syncIndexes();
  await Order.syncIndexes();
  console.log(`seeded ${CATEGORIES.length} categories, ${PRODUCTS.length} products, ${REVIEWS.length} reviews`);
  console.log(`admin: ${adminEmail} / ${adminPassword}`);
  console.log(`demo customer: aarav@example.com / password123`);
  void admin;
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
