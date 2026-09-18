import type { Metadata } from "next";
import Link from "next/link";
import { Package } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { listMyOrders } from "@/lib/commerce/orders";
import { formatPrice, formatDate } from "@/lib/client/format";
import { PageShell } from "@/components/layout/page-shell";
import { Footer } from "@/components/layout/footer";
import { AccountNav } from "@/components/account/account-nav";
import { OrderStatusBadge } from "@/components/commerce/order-status";
import { ProductImage } from "@/components/commerce/product-image";
import { EmptyState } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Orders" };
export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const user = await requireUser();
  const orders = await listMyOrders(user.id);
  return (
    <>
      <PageShell>
        <AccountNav active="orders" />
        <header className="mb-8">
          <p className="eyebrow mb-3">Orders</p>
          <h1 className="display text-4xl md:text-5xl">{orders.length ? `${orders.length} ${orders.length === 1 ? "order" : "orders"}` : "Your orders"}</h1>
        </header>
        {orders.length === 0 ? (
          <EmptyState icon={<Package className="h-8 w-8" />} title="Your orders will appear here." description="Once you've placed one, you can track it from confirmation to delivery." action={<Button href="/shop">Start shopping</Button>} />
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/orders/${o.id}`} className="group flex flex-col gap-4 py-5 md:flex-row md:items-center md:gap-8">
                  <div className="flex -space-x-3">
                    {o.items.slice(0, 3).map((i, idx) => (
                      <ProductImage key={idx} src={i.image} alt="" sizes="48px" className="h-16 w-12 rounded-[var(--r-sm)] ring-2 ring-bg" />
                    ))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] text-fg group-hover:text-fg-soft">{o.items.map((i) => i.name).slice(0, 2).join(", ")}{o.items.length > 2 ? ` +${o.items.length - 2}` : ""}</p>
                    <p className="meta mt-1 font-mono">{o.orderNumber} · {formatDate(o.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <OrderStatusBadge status={o.status} />
                    <span className="tabular text-[15px]">{formatPrice(o.pricing.total)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </PageShell>
      <Footer />
    </>
  );
}
