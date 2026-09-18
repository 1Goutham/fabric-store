import type { Metadata } from "next";
import { CheckoutShell } from "@/components/checkout/shell";
import { Button } from "@/components/ui/button";
import { markCheckoutFailed } from "@/lib/commerce/checkout";
import { getCurrentUser } from "@/lib/auth/session";
import { isValidId } from "@/lib/db";

export const metadata: Metadata = { title: "Payment not completed" };
export const dynamic = "force-dynamic";

export default async function CancelledPage({ searchParams }: { searchParams: Promise<{ checkout?: string; reason?: string }> }) {
  const { checkout, reason } = await searchParams;
  const user = await getCurrentUser();
  if (user && checkout && isValidId(checkout)) await markCheckoutFailed(checkout, "failed").catch(() => undefined);
  const failed = reason === "failed";
  return (
    <CheckoutShell step={3}>
      <div className="mx-auto max-w-xl">
        <p className="eyebrow mb-3">{failed ? "Payment failed" : "Checkout cancelled"}</p>
        <h1 className="display text-4xl md:text-5xl">{failed ? "Payment couldn't be completed." : "No payment was taken."}</h1>
        <p className="mt-4 text-[15px] text-fg-muted">{failed ? "Your card was declined or the payment was interrupted. Nothing has been charged and your bag is exactly as you left it." : "You left before paying. Everything is still in your bag whenever you're ready."}</p>
        <div className="mt-8 flex gap-3">
          <Button href="/checkout">Try again</Button>
          <Button href="/bag" variant="secondary">Back to bag</Button>
        </div>
      </div>
    </CheckoutShell>
  );
}
