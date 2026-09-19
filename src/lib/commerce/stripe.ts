import Stripe from "stripe";
import { env } from "@/lib/env";

let client: Stripe | null = null;

/** Server-only Stripe client. Returns null when no secret key is configured (test gateway mode). */
export function getStripe(): Stripe | null {
  const key = env.stripeSecretKey;
  if (!key) return null;
  if (!client) client = new Stripe(key, { apiVersion: "2025-08-27.basil", typescript: true });
  return client;
}

export const paymentMode = (): "stripe" | "test" => (env.stripeSecretKey ? "stripe" : "test");
