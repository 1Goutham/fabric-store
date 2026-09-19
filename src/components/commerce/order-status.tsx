import { Check } from "lucide-react";
import { cn } from "@/lib/client/cn";
import type { OrderStatus } from "@/lib/constants";
import { Badge } from "@/components/ui/primitives";

const STEPS: { key: OrderStatus; label: string }[] = [
  { key: "confirmed", label: "Confirmed" },
  { key: "processing", label: "Processing" },
  { key: "shipped", label: "Shipped" },
  { key: "delivered", label: "Delivered" },
];

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const tone = status === "delivered" ? "ok" : status === "cancelled" ? "danger" : status === "shipped" ? "accent" : "neutral";
  return <Badge tone={tone} className="capitalize">{status}</Badge>;
}

export function OrderTimeline({ status, timeline }: { status: OrderStatus; timeline: { status: string; at: string; note?: string }[] }) {
  if (status === "cancelled") {
    const at = timeline.find((t) => t.status === "cancelled")?.at;
    return <p className="text-sm text-fg-muted">This order was cancelled{at ? ` on ${new Date(at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : ""}. If you were charged, the refund is on its way.</p>;
  }
  const current = STEPS.findIndex((s) => s.key === status);
  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="Order progress">
      {STEPS.map((s, i) => {
        const done = i <= current;
        const at = timeline.find((t) => t.status === s.key)?.at;
        return (
          <li key={s.key} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px]", done ? "border-fg bg-fg text-bg" : "border-line text-fg-faint")} aria-hidden>
                {done ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              {i < STEPS.length - 1 && <span className={cn("h-px flex-1", i < current ? "bg-fg" : "bg-line")} aria-hidden />}
            </div>
            <div>
              <p className={cn("text-[13px]", done ? "text-fg" : "text-fg-faint")}>{s.label}</p>
              {at && done && <p className="meta">{new Date(at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
