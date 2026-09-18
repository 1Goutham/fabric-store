import { connectDB } from "@/lib/db";
import { Wishlist } from "@/lib/models/Wishlist";
import { Product } from "@/lib/models/Product";
import { errors } from "@/lib/api/respond";
import { slugify } from "./slug";
import { toProductCard } from "./serialize";
import type { WishlistDTO } from "@/types";

async function ensure(userId: string) {
  return (await Wishlist.findOne({ user: userId })) ?? (await Wishlist.create({ user: userId, items: [], collections: [] }));
}

export async function getWishlist(userId: string): Promise<WishlistDTO> {
  await connectDB();
  const w = await Wishlist.findOne({ user: userId }).lean();
  if (!w) return { items: [], collections: [] };
  const ids = w.items.map((i) => i.product);
  const products = await Product.find({ _id: { $in: ids }, status: "active" }).lean();
  const byId = new Map(products.map((p) => [p._id.toString(), p]));
  const items = w.items
    .filter((i) => byId.has(i.product.toString()))
    .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
    .map((i) => ({
      id: i._id.toString(),
      product: toProductCard(byId.get(i.product.toString())!),
      collectionId: i.collectionId ? i.collectionId.toString() : null,
      addedAt: new Date(i.addedAt).toISOString(),
    }));
  const collections = w.collections.map((c) => ({
    id: c._id.toString(),
    name: c.name,
    slug: c.slug,
    count: items.filter((i) => i.collectionId === c._id.toString()).length,
  }));
  return { items, collections };
}

/** Toggle semantics: saving an already-saved product removes it (one tap, both ways). */
export async function toggleWishlist(userId: string, productId: string, collectionId?: string | null): Promise<{ saved: boolean; wishlist: WishlistDTO }> {
  await connectDB();
  const exists = await Product.exists({ _id: productId, status: "active" });
  if (!exists) throw errors.notFound("That product is no longer available.");
  const w = await ensure(userId);
  const idx = w.items.findIndex((i) => i.product.toString() === productId);
  let saved: boolean;
  if (idx >= 0 && collectionId === undefined) {
    w.items.splice(idx, 1);
    saved = false;
  } else if (idx >= 0) {
    w.items[idx].collectionId = collectionId ? (w.collections.id(collectionId)?._id ?? null) : null;
    saved = true;
  } else {
    w.items.push({ product: exists._id, collectionId: collectionId ? (w.collections.id(collectionId)?._id ?? null) : null, addedAt: new Date() });
    saved = true;
  }
  await w.save();
  return { saved, wishlist: await getWishlist(userId) };
}

export async function moveWishlistItem(userId: string, itemId: string, collectionId: string | null) {
  await connectDB();
  const w = await ensure(userId);
  const item = w.items.id(itemId);
  if (!item) throw errors.notFound("That item is not in your saved list.");
  item.collectionId = collectionId ? (w.collections.id(collectionId)?._id ?? null) : null;
  await w.save();
  return getWishlist(userId);
}

export async function removeWishlistItem(userId: string, itemId: string) {
  await connectDB();
  await Wishlist.updateOne({ user: userId }, { $pull: { items: { _id: itemId } } });
  return getWishlist(userId);
}

export async function createCollection(userId: string, name: string) {
  await connectDB();
  const w = await ensure(userId);
  if (w.collections.length >= 12) throw errors.badRequest("You can keep up to 12 collections.");
  const slug = slugify(name);
  if (w.collections.some((c) => c.slug === slug)) throw errors.conflict("You already have a collection with that name.");
  w.collections.push({ name, slug });
  await w.save();
  return getWishlist(userId);
}

export async function deleteCollection(userId: string, collectionId: string) {
  await connectDB();
  const w = await ensure(userId);
  const c = w.collections.id(collectionId);
  if (!c) throw errors.notFound("Collection not found.");
  for (const item of w.items) if (item.collectionId?.toString() === collectionId) item.collectionId = null;
  c.deleteOne();
  await w.save();
  return getWishlist(userId);
}
