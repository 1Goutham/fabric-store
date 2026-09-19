import { DELIVERY_METHODS, FREE_SHIPPING_THRESHOLD, TAX_RATE, type DeliveryMethod } from "@/lib/constants";

export interface PricingBreakdown {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

/** All money math lives here and runs on the server. Amounts are whole rupees. */
export function computePricing(subtotal: number, method: DeliveryMethod = "standard"): PricingBreakdown {
  const m = DELIVERY_METHODS[method];
  let shipping = m.price;
  if (method === "standard" && subtotal >= FREE_SHIPPING_THRESHOLD) shipping = 0;
  if (subtotal === 0) shipping = 0;
  const tax = Math.round(subtotal * TAX_RATE);
  return { subtotal, shipping, tax, total: subtotal + shipping + tax };
}

export function formatPrice(amount: number, opts: { compact?: boolean } = {}): string {
  const f = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
  const s = f.format(amount);
  return opts.compact ? s.replace(/ /g, "") : s;
}

export function discountPercent(price: number, compareAt: number | null | undefined): number | null {
  if (!compareAt || compareAt <= price) return null;
  return Math.round(((compareAt - price) / compareAt) * 100);
}
