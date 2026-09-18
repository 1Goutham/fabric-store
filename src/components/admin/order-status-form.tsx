"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { OrderDTO } from "@/types";
import type { OrderStatus } from "@/lib/constants";
import { api, messageOf } from "@/lib/client/api";
import { toast } from "@/lib/store/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { formatDate } from "@/lib/client/format";

const NEXT: Record<OrderStatus, { status: OrderStatus; label: string }[]> = {
  confirmed: [{ status: "processing", label: "Start processing" }, { status: "cancelled", label: "Cancel order" }],
  processing: [{ status: "shipped", label: "Mark shipped" }, { status: "cancelled", label: "Cancel order" }],
  shipped: [{ status: "delivered", label: "Mark delivered" }],
  delivered: [],
  cancelled: [],
};

export function OrderStatusForm({ order }: { order: OrderDTO }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<OrderStatus | null>(null);
  const options = NEXT[order.status];

  const update = async (status: OrderStatus) => {
    if (status === "cancelled" && !confirm("Cancel this order? The customer will see it as cancelled.")) return;
    setBusy(status);
    try {
      await api.patch(`/api/admin/orders/${order.id}`, { status, note: note || undefined });
      toast({ title: `Order ${status}`, tone: "success" });
      setNote("");
      router.refresh();
    } catch (err) {
      toast({ title: "Couldn't update status", description: messageOf(err), tone: "danger" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <aside className="space-y-6 lg:sticky lg:top-[calc(var(--nav-h)+40px)] lg:self-start">
      <section className="rounded-[var(--r-lg)] border border-line p-5">
        <h2 className="text-[14px] text-fg">Update status</h2>
        <p className="meta mt-1 capitalize">Currently {order.status}</p>
        {options.length > 0 ? (
          <>
            <Input label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tracking ID, courier…" maxLength={200} wrapperClassName="mt-4" />
            <div className="mt-4 flex flex-col gap-2">
              {options.map((o) => (
                <Button key={o.status} variant={o.status === "cancelled" ? "danger" : "primary"} onClick={() => update(o.status)} loading={busy === o.status} disabled={busy !== null}>
                  {o.label}
                </Button>
              ))}
            </div>
          </>
        ) : (
          <p className="mt-4 text-[13px] text-fg-muted">This order is final.</p>
        )}
      </section>
      <section className="rounded-[var(--r-lg)] border border-line p-5">
        <h2 className="text-[14px] text-fg">History</h2>
        <ol className="mt-3 space-y-2 text-[13px]">
          {order.timeline.map((t, i) => (
            <li key={i} className="flex items-start justify-between gap-3">
              <span className="capitalize text-fg-soft">{t.status}{t.note ? <span className="text-fg-muted"> · {t.note}</span> : null}</span>
              <span className="meta whitespace-nowrap">{formatDate(t.at, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
            </li>
          ))}
        </ol>
      </section>
    </aside>
  );
}
