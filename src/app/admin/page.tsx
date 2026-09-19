import Link from "next/link";
import { getAdminStats } from "@/lib/commerce/admin-stats";
import { formatPrice, formatDate } from "@/lib/client/format";
import { AdminHeader, Stat, Table, Th, Td, Bars } from "@/components/admin/ui";
import { OrderStatusBadge } from "@/components/commerce/order-status";
import { ProductImage } from "@/components/commerce/product-image";

export default async function AdminOverview() {
  const s = await getAdminStats();
  return (
    <>
      <AdminHeader title="Overview" description="Last 30 days, live from the database." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Revenue" value={formatPrice(s.revenue)} hint="All paid orders" />
        <Stat label="Orders" value={String(s.orders)} hint={`${s.byStatus.processing ?? 0} processing · ${s.byStatus.shipped ?? 0} shipped`} />
        <Stat label="Average order" value={formatPrice(s.aov)} />
        <Stat label="Customers" value={String(s.customers)} hint={`${s.products} active products`} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section className="rounded-[var(--r-lg)] border border-line p-5">
          <h2 className="text-[14px] text-fg">Revenue, daily</h2>
          <div className="mt-6">
            <Bars data={s.daily} label="Daily revenue" />
          </div>
        </section>
        <section className="rounded-[var(--r-lg)] border border-line p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[14px] text-fg">Low stock</h2>
            <Link href="/admin/products?inStock=false" className="text-[12px] text-fg-muted hover:text-fg">All products</Link>
          </div>
          <ul className="mt-4 divide-y divide-line">
            {s.lowStock.length === 0 && <li className="py-3 text-[13px] text-fg-muted">Everything is stocked.</li>}
            {s.lowStock.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-2.5">
                <ProductImage src={p.image} alt="" sizes="32px" className="h-10 w-8 rounded-[4px]" />
                <Link href={`/admin/products/${p.id}`} className="min-w-0 flex-1 truncate text-[13px] text-fg-soft hover:text-fg">{p.name}</Link>
                <span className={`tabular text-[12px] ${p.stock === 0 ? "text-danger" : "text-warn"}`}>{p.stock === 0 ? "Sold out" : `${p.stock} left`}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[14px] text-fg">Recent orders</h2>
            <Link href="/admin/orders" className="text-[12px] text-fg-muted hover:text-fg">All orders</Link>
          </div>
          <Table>
            <thead><tr><Th>Order</Th><Th>Customer</Th><Th>Status</Th><Th className="text-right">Total</Th></tr></thead>
            <tbody>
              {s.recentOrders.map((o) => (
                <tr key={o.id} className="hover:bg-white/[0.02]">
                  <Td><Link href={`/admin/orders/${o.id}`} className="font-mono text-fg hover:underline">{o.orderNumber}</Link><p className="meta">{formatDate(o.createdAt)}</p></Td>
                  <Td>{o.user?.name ?? "—"}<p className="meta">{o.user?.email}</p></Td>
                  <Td><OrderStatusBadge status={o.status} /></Td>
                  <Td className="tabular text-right text-fg">{formatPrice(o.pricing.total)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        </section>
        <section>
          <h2 className="mb-3 text-[14px] text-fg">Top sellers</h2>
          <ol className="divide-y divide-line rounded-[var(--r-lg)] border border-line px-4">
            {s.topProducts.map((p, i) => (
              <li key={p.id} className="flex items-center gap-3 py-2.5">
                <span className="tabular w-4 text-[12px] text-fg-faint">{i + 1}</span>
                <ProductImage src={p.image} alt="" sizes="32px" className="h-10 w-8 rounded-[4px]" />
                <Link href={`/admin/products/${p.id}`} className="min-w-0 flex-1 truncate text-[13px] text-fg-soft hover:text-fg">{p.name}</Link>
                <span className="tabular text-[12px] text-fg-muted">{p.sales} sold</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </>
  );
}
