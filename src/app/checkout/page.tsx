import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { getCartSummary } from "@/lib/commerce/cart";
import { paymentMode } from "@/lib/commerce/stripe";
import { CheckoutFlow } from "@/components/checkout/checkout-flow";
import { CheckoutShell } from "@/components/checkout/shell";
import { EmptyState } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Checkout" };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const user = await requireUser();
  const cart = await getCartSummary(user.id);
  return (
    <CheckoutShell step={1}>
      {cart.items.length === 0 ? (
        <EmptyState title="Your bag is empty." description="Add something first, then come back." action={<Button href="/shop">Shop</Button>} />
      ) : (
        <CheckoutFlow user={user} cart={cart} mode={paymentMode()} />
      )}
    </CheckoutShell>
  );
}
