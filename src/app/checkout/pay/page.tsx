import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getCheckoutForUser } from "@/lib/commerce/checkout";
import { paymentMode } from "@/lib/commerce/stripe";
import { CheckoutShell } from "@/components/checkout/shell";
import { TestGateway } from "@/components/checkout/test-gateway";
import { isValidId } from "@/lib/db";

export const metadata: Metadata = { title: "Payment" };
export const dynamic = "force-dynamic";

/** Test gateway page: only reachable when Stripe is not configured. */
export default async function PayPage({ searchParams }: { searchParams: Promise<{ checkout?: string }> }) {
  if (paymentMode() !== "test") redirect("/checkout");
  const user = await requireUser();
  const { checkout } = await searchParams;
  if (!checkout || !isValidId(checkout)) notFound();
  const doc = await getCheckoutForUser(checkout, user.id);
  if (!doc) notFound();
  if (doc.status === "completed") redirect(`/checkout/success?checkout=${checkout}`);
  return (
    <CheckoutShell step={3}>
      <TestGateway checkoutId={checkout} total={doc.pricing?.total ?? 0} itemCount={doc.items.reduce((n, i) => n + (i.quantity ?? 1), 0)} />
    </CheckoutShell>
  );
}
