import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getMyOrder } from "@/lib/commerce/orders";
import { isValidId } from "@/lib/db";
import { PageShell } from "@/components/layout/page-shell";
import { Footer } from "@/components/layout/footer";
import { OrderSummary } from "@/components/account/order-summary";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Order" };
export const dynamic = "force-dynamic";

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidId(id)) notFound();
  const user = await requireUser();
  const order = await getMyOrder(user.id, id).catch(() => null);
  if (!order) notFound();
  return (
    <>
      <PageShell className="max-w-3xl">
        <Link href="/orders" className="text-[13px] text-fg-muted hover:text-fg">← All orders</Link>
        <header className="mb-8 mt-4">
          <p className="eyebrow mb-3">Order</p>
          <h1 className="display font-mono text-3xl md:text-4xl">{order.orderNumber}</h1>
        </header>
        <OrderSummary order={order} />
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/shop" variant="secondary">Shop again</Button>
          {order.status === "delivered" && <Button href={`/products/${order.items[0].slug}#reviews`}>Review a piece</Button>}
        </div>
      </PageShell>
      <Footer />
    </>
  );
}
