import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getCheckoutForUser, verifyStripeSession } from "@/lib/commerce/checkout";
import { Order } from "@/lib/models/Order";
import { toOrder } from "@/lib/commerce/serialize";
import { isValidId } from "@/lib/db";
import { CheckoutShell } from "@/components/checkout/shell";
import { Button } from "@/components/ui/button";
import { OrderSummary } from "@/components/account/order-summary";
import { ClearCartOnMount } from "@/components/checkout/clear-cart";
import type { OrderDTO } from "@/types";

export const metadata: Metadata = { title: "Order confirmed" };
export const dynamic = "force-dynamic";

/**
 * Success page. Payment is verified server-side here, never trusted from the URL:
 * Stripe → retrieve the session; test gateway → read the completed checkout.
 */
export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string; checkout?: string }> }) {
  const user = await requireUser();
  const { session_id, checkout } = await searchParams;
  let order: OrderDTO | null = null;
  let pending = false;

  try {
    if (session_id) {
      const res = await verifyStripeSession(session_id, user.id);
      if (res.paid && res.order) order = toOrder(res.order);
      else pending = true;
    } else if (checkout && isValidId(checkout)) {
      const c = await getCheckoutForUser(checkout, user.id);
      if (c?.status === "completed" && c.order) {
        const o = await Order.findOne({ _id: c.order, user: user.id }).lean();
        if (o) order = toOrder(o);
      } else if (c?.status === "pending") pending = true;
    }
  } catch {
    pending = true;
  }

  if (!order && !pending) redirect("/bag");

  return (
    <CheckoutShell step={4}>
      <ClearCartOnMount />
      {order ? (
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ok/15 text-ok"><Check className="h-4.5 w-4.5" /></span>
            <p className="eyebrow">Order confirmed</p>
          </div>
          <h1 className="display mt-4 text-4xl md:text-5xl">Thank you, {user.name.split(" ")[0]}.</h1>
          <p className="mt-3 text-[15px] text-fg-muted">
            Order <span className="font-mono text-fg">{order.orderNumber}</span>. We&rsquo;ve emailed the details to {user.email}.
          </p>
          <div className="mt-10">
            <OrderSummary order={order} />
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <Button href={`/orders/${order.id}`}>Track this order</Button>
            <Button href="/shop" variant="secondary">Keep browsing</Button>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-xl text-center">
          <h1 className="headline text-3xl">Confirming your payment…</h1>
          <p className="mt-3 text-[15px] text-fg-muted">This usually takes a few seconds. Your bag is safe either way.</p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href={session_id ? `/checkout/success?session_id=${session_id}` : `/checkout/success?checkout=${checkout}`} className="tactile inline-flex h-11 items-center rounded-full bg-fg px-6 text-sm text-bg">Refresh</Link>
            <Button href="/orders" variant="secondary">My orders</Button>
          </div>
        </div>
      )}
    </CheckoutShell>
  );
}
