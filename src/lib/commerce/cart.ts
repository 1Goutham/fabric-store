import { connectDB } from "@/lib/db";
import { Cart } from "@/lib/models/Cart";
import { Product, type ProductDoc } from "@/lib/models/Product";
import { errors } from "@/lib/api/respond";
import { toProductCard } from "./serialize";
import type { CartLine, CartSummary } from "@/types";

/** Available stock for a colour/size, falling back to aggregate stock when a product has no variants. */
export function availableFor(p: Pick<ProductDoc, "variants" | "stock">, color: string, size: string): number {
  if (p.variants && p.variants.length > 0) {
    const v = p.variants.find((x) => x.color === color && x.size === size);
    return v ? v.stock : 0;
  }
  return p.stock ?? 0;
}

/**
 * Cart lines are priced from the product at read time, so the client can never
 * pin an old price. Lines whose product vanished are dropped silently.
 */
export async function getCartSummary(userId: string): Promise<CartSummary> {
  await connectDB();
  const cart = await Cart.findOne({ user: userId }).lean();
  if (!cart || cart.items.length === 0) return { items: [], subtotal: 0, count: 0 };

  const ids = [...new Set(cart.items.map((i) => i.product.toString()))];
  const products = await Product.find({ _id: { $in: ids }, status: "active" }).lean();
  const byId = new Map(products.map((p) => [p._id.toString(), p]));

  const items: CartLine[] = [];
  for (const it of cart.items) {
    const p = byId.get(it.product.toString());
    if (!p) continue;
    const available = availableFor(p, it.color, it.size);
    items.push({
      id: it._id.toString(),
      product: toProductCard(p),
      color: it.color,
      size: it.size,
      quantity: it.quantity,
      unitPrice: p.price,
      lineTotal: p.price * it.quantity,
      available,
    });
  }
  const subtotal = items.reduce((s, l) => s + l.lineTotal, 0);
  const count = items.reduce((s, l) => s + l.quantity, 0);
  return { items, subtotal, count };
}

export async function addToCart(userId: string, input: { productId: string; color: string; size: string; quantity: number }) {
  await connectDB();
  const product = await Product.findOne({ _id: input.productId, status: "active" }).lean();
  if (!product) throw errors.notFound("That product is no longer available.");
  if (!product.colors.some((c) => c.name === input.color)) throw errors.badRequest("Choose an available colour.", { color: "Not available" });
  if (!(product.sizes as string[]).includes(input.size)) throw errors.badRequest("Choose an available size.", { size: "Not available" });

  const available = availableFor(product, input.color, input.size);
  if (available <= 0) throw errors.conflict("That size just sold out.");

  const cart = (await Cart.findOne({ user: userId })) ?? new Cart({ user: userId, items: [] });
  const existing = cart.items.find((i) => i.product.toString() === input.productId && i.color === input.color && i.size === input.size);
  if (existing) {
    existing.quantity = Math.min(10, existing.quantity + input.quantity, available);
  } else {
    cart.items.push({ product: product._id, color: input.color, size: input.size, quantity: Math.min(input.quantity, available, 10), addedAt: new Date() });
  }
  await cart.save();
  return getCartSummary(userId);
}

export async function updateCartItem(userId: string, itemId: string, quantity: number) {
  await connectDB();
  const cart = await Cart.findOne({ user: userId });
  if (!cart) throw errors.notFound("Your bag is empty.");
  const item = cart.items.id(itemId);
  if (!item) throw errors.notFound("That item is no longer in your bag.");
  if (quantity <= 0) {
    item.deleteOne();
  } else {
    const product = await Product.findById(item.product).lean();
    const available = product ? availableFor(product, item.color, item.size) : 0;
    if (available <= 0) throw errors.conflict("That size just sold out.");
    item.quantity = Math.min(quantity, available, 10);
  }
  await cart.save();
  return getCartSummary(userId);
}

export async function removeCartItem(userId: string, itemId: string) {
  await connectDB();
  await Cart.updateOne({ user: userId }, { $pull: { items: { _id: itemId } } });
  return getCartSummary(userId);
}

export async function clearCart(userId: string) {
  await connectDB();
  await Cart.updateOne({ user: userId }, { $set: { items: [] } });
}
