import Link from "next/link";
import type { OrderDTO } from "@/types";
import { formatPrice, formatDate } from "@/lib/client/format";
import { DELIVERY_METHODS } from "@/lib/constants";
import { ProductImage } from "@/components/commerce/product-image";
import { OrderStatusBadge, OrderTimeline } from "@/components/commerce/order-status";

export function OrderSummary({ order, showTimeline = true }: { order: OrderDTO; showTimeline?: boolean }) {
  return (
    <div className="rounded-[var(--r-xl)] border border-line">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4 md:px-6">
        <div>
          <p className="font-mono text-[13px] text-fg">{order.orderNumber}</p>
          <p className="meta mt-0.5">Placed {formatDate(order.createdAt)} · {order.payment.provider === "stripe" ? "Paid with Stripe" : "Paid (test gateway)"}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>
      {showTimeline && (
        <div className="border-b border-line px-5 py-5 md:px-6">
          <OrderTimeline status={order.status} timeline={order.timeline} />
        </div>
      )}
      <ul className="divide-y divide-line px-5 md:px-6">
        {order.items.map((i, idx) => (
          <li key={`${i.productId}-${idx}`} className="flex gap-4 py-4">
            <Link href={`/products/${i.slug}`} className="shrink-0">
              <ProductImage src={i.image} alt="" sizes="64px" className="h-20 w-16 rounded-[var(--r-sm)]" />
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={`/products/${i.slug}`} className="block truncate text-[14px] text-fg">{i.name}</Link>
              <p className="meta">{i.color} · {i.size} · ×{i.quantity}</p>
            </div>
            <span className="tabular text-[14px]">{formatPrice(i.lineTotal)}</span>
          </li>
        ))}
      </ul>
      <div className="grid gap-6 border-t border-line px-5 py-5 text-[14px] md:grid-cols-2 md:px-6">
        <div>
          <p className="eyebrow mb-2">Delivery</p>
          <p className="text-fg-soft">{order.shippingAddress.fullName}</p>
          <p className="text-fg-muted">{order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ""}</p>
          <p className="text-fg-muted">{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
          <p className="meta mt-1">{DELIVERY_METHODS[order.deliveryMethod].label} · {DELIVERY_METHODS[order.deliveryMethod].eta}</p>
        </div>
        <dl className="space-y-2">
          <div className="flex justify-between"><dt className="text-fg-muted">Subtotal</dt><dd className="tabular">{formatPrice(order.pricing.subtotal)}</dd></div>
          <div className="flex justify-between"><dt className="text-fg-muted">Delivery</dt><dd className="tabular">{order.pricing.shipping === 0 ? "Free" : formatPrice(order.pricing.shipping)}</dd></div>
          <div className="flex justify-between"><dt className="text-fg-muted">GST</dt><dd className="tabular">{formatPrice(order.pricing.tax)}</dd></div>
          <div className="flex justify-between border-t border-line pt-2 text-[15px]"><dt>Total</dt><dd className="tabular text-fg">{formatPrice(order.pricing.total)}</dd></div>
        </dl>
      </div>
    </div>
  );
}
