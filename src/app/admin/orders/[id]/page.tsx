import Link from "next/link";
import { notFound } from "next/navigation";
import { isValidId } from "@/lib/db";
import { adminGetOrder } from "@/lib/commerce/orders";
import { AdminHeader } from "@/components/admin/ui";
import { OrderSummary } from "@/components/account/order-summary";
import { OrderStatusForm } from "@/components/admin/order-status-form";

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidId(id)) notFound();
  const order = await adminGetOrder(id).catch(() => null);
  if (!order) notFound();
  return (
    <>
      <Link href="/admin/orders" className="text-[13px] text-fg-muted hover:text-fg">← Orders</Link>
      <div className="mt-3">
        <AdminHeader title={order.orderNumber} description={order.user ? `${order.user.name} · ${order.user.email}` : undefined} />
      </div>
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <OrderSummary order={order} />
        <OrderStatusForm order={order} />
      </div>
    </>
  );
}
