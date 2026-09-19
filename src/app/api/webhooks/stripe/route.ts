import type Stripe from "stripe";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getStripe } from "@/lib/commerce/stripe";
import { finalizeOrder, markCheckoutFailed } from "@/lib/commerce/checkout";

export const runtime = "nodejs";

/**
 * Stripe webhook. The signature is verified against the raw body; only then
 * is the order created. Idempotent: replays return 200 without side effects.
 */
export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = env.stripeWebhookSecret;
  if (!stripe || !secret) return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });

  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, signature, secret);
  } catch (err) {
    console.warn("[stripe] bad signature", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        const checkoutId = session.metadata?.checkoutId;
        if (checkoutId && session.payment_status === "paid") {
          await finalizeOrder(checkoutId, { sessionId: session.id, paymentIntentId: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null });
        }
        break;
      }
      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.checkoutId) await markCheckoutFailed(session.metadata.checkoutId, "failed");
        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.checkoutId) await markCheckoutFailed(session.metadata.checkoutId, "expired");
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("[stripe] handler failed", event.type, err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
