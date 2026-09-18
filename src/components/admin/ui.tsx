import { cn } from "@/lib/client/cn";

export function AdminHeader({ title, description, action }: { title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="headline text-3xl">{title}</h1>
        {description && <p className="mt-1.5 text-[14px] text-fg-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Stat({ label, value, hint, className }: { label: string; value: string; hint?: string; className?: string }) {
  return (
    <div className={cn("rounded-[var(--r-lg)] border border-line p-5", className)}>
      <p className="text-[12px] tracking-wide text-fg-muted">{label}</p>
      <p className="tabular mt-2 font-display text-[28px] tracking-[-0.02em] text-fg">{value}</p>
      {hint && <p className="meta mt-1">{hint}</p>}
    </div>
  );
}

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-x-auto rounded-[var(--r-lg)] border border-line", className)}>
      <table className="w-full min-w-[640px] text-[13px]">{children}</table>
    </div>
  );
}
export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th scope="col" className={cn("border-b border-line px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.12em] text-fg-muted", className)}>{children}</th>;
}
export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn("border-b border-line px-4 py-3 align-middle text-fg-soft last:border-0", className)}>{children}</td>;
}

/** Minimal bar chart: one hue, accessible summary, no library. */
export function Bars({ data, label }: { data: { date: string; revenue: number; orders: number }[]; label: string }) {
  const max = Math.max(1, ...data.map((d) => d.revenue));
  const total = data.reduce((s, d) => s + d.revenue, 0);
  return (
    <figure>
      <div className="flex h-40 items-stretch gap-[3px]" role="img" aria-label={`${label}: ₹${total.toLocaleString("en-IN")} over ${data.length} days`}>
        {data.map((d) => (
          <div key={d.date} className="group relative flex flex-1 flex-col justify-end">
            <div className="w-full rounded-t-[3px] bg-accent/70 transition-colors group-hover:bg-accent" style={{ height: `${Math.max(2, (d.revenue / max) * 100)}%` }} />
            <span className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-surface-3 px-2 py-1 text-[11px] text-fg group-hover:block">
              {new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · ₹{d.revenue.toLocaleString("en-IN")} · {d.orders} {d.orders === 1 ? "order" : "orders"}
            </span>
          </div>
        ))}
      </div>
      <figcaption className="mt-2 flex justify-between text-[11px] text-fg-faint">
        <span>{new Date(data[0]?.date ?? Date.now()).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
        <span>Today</span>
      </figcaption>
    </figure>
  );
}
