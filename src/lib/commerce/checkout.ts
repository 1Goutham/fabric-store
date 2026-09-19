import { connectDB } from "@/lib/db";
import { env } from "@/lib/env";
import { Checkout, type CheckoutDoc } from "@/lib/models/Checkout";
import { Order } from "@/lib/models/Order";
import { Product } from "@/lib/models/Product";
import { User } from "@/lib/models/User";
import { errors } from "@/lib/api/respond";
import { computePricing } from "./pricing";
import { getCartSummary, clearCart } from "./cart";
import { orderNumber } from "./slug";
import { getStripe, paymentMode } from "./stripe";
import { recordPurchaseSignals } from "@/lib/intelligence/preferences";
import type { Address } from "@/types";
import type { DeliveryMethod } from "@/lib/constants";

const CHECKOUT_TTL_MS = 60 * 60 * 1000;

/**
 * Step 1: snapshot the cart server-side and open a payment session.
 * Returns the URL the customer should be sent to.
 */
export async function beginCheckout(userId: string, input: { address: Address; deliveryMethod: DeliveryMethod; saveAddress?: boolean }) {
  await connectDB();
  const cart = await getCartSummary(userId);
  if (cart.items.length === 0) throw errors.badRequest("Your bag is empty.");

  const short = cart.items.filter((l) => l.available < l.quantity);
  if (short.length > 0) {
    throw errors.conflict(`Only ${short[0].available} left of ${short[0].product.name} in ${short[0].size}. Please adjust your bag.`);
  }

  const pricing = computePricing(cart.subtotal, input.deliveryMethod);
  const provider = paymentMode();

  if (input.saveAddress) {
    await User.updateOne(
      { _id: userId },
      { $push: { addresses: { ...input.address, label: "Home", isDefault: false } } }
    ).catch(() => undefined);
  }

  const checkout = await Checkout.create({
    user: userId,
    items: cart.items.map((l) => ({
      product: l.product.id,
      name: l.product.name,
      slug: l.product.slug,
      image: l.product.image?.url ?? "",
      color: l.color,
      size: l.size,
      unitPrice: l.unitPrice,
      quantity: l.quantity,
      lineTotal: l.lineTotal,
    })),
    shippingAddress: input.address,
    deliveryMethod: input.deliveryMethod,
    pricing: { ...pricing, currency: "INR" },
    provider,
    status: "pending",
    expiresAt: new Date(Date.now() + CHECKOUT_TTL_MS),
  });

  if (provider === "test") {
    return { url: `${env.appUrl}/checkout/pay?checkout=${checkout._id.toString()}`, provider, checkoutId: checkout._id.toString() };
  }

  const stripe = getStripe()!;
  const currency = env.currency;
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: undefined,
    client_reference_id: checkout._id.toString(),
    metadata: { checkoutId: checkout._id.toString(), userId },
    line_items: [
      ...cart.items.map((l) => ({
        quantity: l.quantity,
        price_data: {
          currency,
          unit_amount: l.unitPrice * 100,
          product_data: {
            name: l.product.name,
            description: `${l.color} · ${l.size}`,
            ...(l.product.image?.url ? { images: [l.product.image.url] } : {}),
          },
        },
      })),
      ...(pricing.shipping > 0
        ? [{ quantity: 1, price_data: { currency, unit_amount: pricing.shipping * 100, product_data: { name: `Delivery (${input.deliveryMethod})` } } }]
        : []),
      ...(pricing.tax > 0 ? [{ quantity: 1, price_data: { currency, unit_amount: pricing.tax * 100, product_data: { name: "GST" } } }] : []),
    ],
    success_url: `${env.appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.appUrl}/checkout/cancelled?checkout=${checkout._id.toString()}`,
    expires_at: Math.floor((Date.now() + 30 * 60 * 1000) / 1000),
  });

  checkout.providerSessionId = session.id;
  await checkout.save();
  return { url: session.url!, provider, checkoutId: checkout._id.toString() };
}

/**
 * Step 2: called only after the payment provider confirmed payment (webhook
 * or server-side verification). Idempotent on the provider session id.
 */
export async function finalizeOrder(checkoutId: string, payment: { sessionId: string; paymentIntentId?: string | null }) {
  await connectDB();
  const existing = await Order.findOne({ "payment.sessionId": payment.sessionId }).lean();
  if (existing) return existing;

  const checkout = await Checkout.findById(checkoutId);
  if (!checkout) throw errors.notFound("Checkout session not found.");
  if (checkout.status === "completed" && checkout.order) {
    const o = await Order.findById(checkout.order).lean();
    if (o) return o;
  }

  // Decrement stock, per line, only when enough remains. Products without
  // variants decrement the aggregate stock instead.
  for (const line of checkout.items) {
    const product = await Product.findById(line.product);
    if (!product) continue;
    const qty = line.quantity ?? 1;
    if (product.variants.length > 0) {
      const res = await Product.updateOne(
        { _id: product._id, variants: { $elemMatch: { color: line.color, size: line.size, stock: { $gte: qty } } } },
        { $inc: { "variants.$.stock": -qty, stock: -qty, salesCount: qty } }
      );
      if (res.modifiedCount === 0) console.warn(`[checkout] oversold ${product.slug} ${line.color}/${line.size}`);
    } else {
      await Product.updateOne({ _id: product._id, stock: { $gte: qty } }, { $inc: { stock: -qty, salesCount: qty } });
    }
  }

  const order = await Order.create({
    orderNumber: orderNumber(),
    user: checkout.user,
    items: checkout.items.map((i) => ({
      product: i.product,
      name: i.name,
      slug: i.slug,
      image: i.image ?? "",
      color: i.color,
      size: i.size,
      sku: i.sku,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      lineTotal: i.lineTotal,
    })),
    shippingAddress: checkout.shippingAddress,
    deliveryMethod: checkout.deliveryMethod,
    pricing: checkout.pricing,
    payment: { provider: checkout.provider, sessionId: payment.sessionId, paymentIntentId: payment.paymentIntentId ?? undefined, status: "paid" },
    status: "confirmed",
    timeline: [{ status: "confirmed", at: new Date(), note: "Payment received" }],
    paidAt: new Date(),
  });

  checkout.status = "completed";
  checkout.order = order._id;
  await checkout.save();
  await clearCart(checkout.user.toString());
  await recordPurchaseSignals(checkout.user.toString(), checkout.items.map((i) => i.product.toString())).catch(() => undefined);
  return order.toObject();
}

export async function markCheckoutFailed(checkoutId: string, status: "failed" | "expired" = "failed") {
  await connectDB();
  await Checkout.updateOne({ _id: checkoutId, status: "pending" }, { $set: { status } });
}

export async function getCheckoutForUser(checkoutId: string, userId: string): Promise<CheckoutDoc | null> {
  await connectDB();
  return Checkout.findOne({ _id: checkoutId, user: userId }).lean();
}

/** Server-side verification of a Stripe Checkout Session for the success page. */
export async function verifyStripeSession(sessionId: string, userId: string) {
  const stripe = getStripe();
  if (!stripe) throw errors.badRequest("Stripe is not configured.");
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const checkoutId = session.metadata?.checkoutId;
  if (!checkoutId || session.metadata?.userId !== userId) throw errors.forbidden();
  if (session.payment_status !== "paid") return { paid: false as const, order: null };
  const order = await finalizeOrder(checkoutId, {
    sessionId: session.id,
    paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null,
  });
  return { paid: true as const, order };
}
