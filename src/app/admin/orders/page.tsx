import Link from "next/link";
import { adminListOrders } from "@/lib/commerce/orders";
import { formatPrice, formatDate } from "@/lib/client/format";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/constants";
import { AdminHeader, Table, Th, Td } from "@/components/admin/ui";
import { OrderStatusBadge } from "@/components/commerce/order-status";
import { Pagination } from "@/components/commerce/pagination";
import { AdminSearch } from "@/components/admin/search";

export default async function AdminOrders({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const raw = await searchParams;
  const page = Math.max(1, Number(raw.page ?? 1) || 1);
  const status = ORDER_STATUSES.includes(raw.status as OrderStatus) ? (raw.status as OrderStatus) : undefined;
  const { orders, pagination, totalRevenue } = await adminListOrders({ page, pageSize: 20, status, search: raw.q });
  return (
    <>
      <AdminHeader title="Orders" description={`${pagination.total} orders · ${formatPrice(totalRevenue)} lifetime`} />
      <AdminSearch placeholder="Order number" statuses={["all", ...ORDER_STATUSES]} />
      <Table className="mt-4">
        <thead><tr><Th>Order</Th><Th>Customer</Th><Th>Items</Th><Th>Status</Th><Th className="text-right">Total</Th></tr></thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="hover:bg-white/[0.02]">
              <Td><Link href={`/admin/orders/${o.id}`} className="font-mono text-fg hover:underline">{o.orderNumber}</Link><p className="meta">{formatDate(o.createdAt)} · {o.payment.provider}</p></Td>
              <Td>{o.user?.name ?? "—"}<p className="meta">{o.user?.email}</p></Td>
              <Td>{o.items.reduce((n, i) => n + i.quantity, 0)}</Td>
              <Td><OrderStatusBadge status={o.status} /></Td>
              <Td className="tabular text-right text-fg">{formatPrice(o.pricing.total)}</Td>
            </tr>
          ))}
          {orders.length === 0 && <tr><Td className="py-10 text-center text-fg-muted">No orders match.</Td><Td /><Td /><Td /><Td /></tr>}
        </tbody>
      </Table>
      <Pagination pagination={pagination} basePath="/admin/orders" params={raw} className="mt-8" />
    </>
  );
}
