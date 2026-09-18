import Link from "next/link";
import { cn } from "@/lib/client/cn";
import { formatPrice, discountPercent } from "@/lib/commerce/pricing";

export function Badge({ children, tone = "neutral", className }: { children: React.ReactNode; tone?: "neutral" | "accent" | "ok" | "warn" | "danger" | "outline"; className?: string }) {
  const tones = {
    neutral: "bg-white/[0.07] text-fg-soft",
    accent: "bg-accent-soft text-accent",
    ok: "bg-ok/15 text-ok",
    warn: "bg-warn/15 text-warn",
    danger: "bg-danger/15 text-danger",
    outline: "border border-line-strong text-fg-muted",
  };
  return <span className={cn("inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-medium tracking-wide", tones[tone], className)}>{children}</span>;
}

export function Price({ amount, compareAt, className, size = "md" }: { amount: number; compareAt?: number | null; className?: string; size?: "sm" | "md" | "lg" }) {
  const pct = discountPercent(amount, compareAt);
  const sizes = { sm: "text-[13px]", md: "text-[15px]", lg: "text-xl" };
  return (
    <span className={cn("tabular inline-flex items-baseline gap-2", sizes[size], className)}>
      <span className="text-fg">{formatPrice(amount)}</span>
      {pct && compareAt ? (
        <>
          <span className="text-fg-faint line-through">{formatPrice(compareAt)}</span>
          <span className="text-[11px] text-accent">−{pct}%</span>
        </>
      ) : null}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton", className)} />;
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cn("eyebrow", className)}>{children}</p>;
}

export function SectionHeading({ eyebrow, title, description, action, className, as: Tag = "h2" }: { eyebrow?: string; title: string; description?: string; action?: { label: string; href: string }; className?: string; as?: "h1" | "h2" | "h3" }) {
  return (
    <div className={cn("flex flex-col gap-3 md:flex-row md:items-end md:justify-between", className)}>
      <div className="max-w-2xl">
        {eyebrow && <Eyebrow className="mb-3">{eyebrow}</Eyebrow>}
        <Tag className="headline text-[26px] md:text-[34px]">{title}</Tag>
        {description && <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-fg-muted">{description}</p>}
      </div>
      {action && (
        <Link href={action.href} className="link-underline self-start text-sm text-fg-soft hover:text-fg md:self-auto">
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cn("border-0 border-t border-line", className)} />;
}

export function Rating({ value, count, size = "sm", className }: { value: number; count?: number; size?: "sm" | "md"; className?: string }) {
  const stars = Array.from({ length: 5 }, (_, i) => Math.max(0, Math.min(1, value - i)));
  const dim = size === "sm" ? 12 : 16;
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)} aria-label={`Rated ${value.toFixed(1)} out of 5${count !== undefined ? ` from ${count} reviews` : ""}`}>
      <span className="inline-flex gap-[2px]" aria-hidden>
        {stars.map((fill, i) => (
          <svg key={i} width={dim} height={dim} viewBox="0 0 24 24" className="text-accent">
            <defs>
              <linearGradient id={`g${i}${fill}`}>
                <stop offset={`${fill * 100}%`} stopColor="currentColor" />
                <stop offset={`${fill * 100}%`} stopColor="currentColor" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            <path fill={`url(#g${i}${fill})`} d="M12 2.5l2.9 6.3 6.9.7-5.1 4.7 1.4 6.8L12 17.6 5.9 21l1.4-6.8L2.2 9.5l6.9-.7z" />
          </svg>
        ))}
      </span>
      {count !== undefined && <span className="meta">{count > 0 ? `${value.toFixed(1)} · ${count}` : "No reviews yet"}</span>}
    </span>
  );
}

export function EmptyState({ title, description, action, icon, className }: { title: string; description?: string; action?: React.ReactNode; icon?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-20 text-center", className)}>
      {icon && <div className="mb-5 text-fg-faint">{icon}</div>}
      <h3 className="headline text-xl">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-fg-muted">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function GlassPanel({ children, className, strong }: { children: React.ReactNode; className?: string; strong?: boolean }) {
  return <div className={cn("glass rounded-[var(--r-xl)]", strong && "glass-strong", className)}>{children}</div>;
}

export function Container({ children, className, wide }: { children: React.ReactNode; className?: string; wide?: boolean }) {
  return <div className={cn("mx-auto w-full px-5 md:px-10", wide ? "max-w-[1600px]" : "max-w-[var(--content-max)]", className)}>{children}</div>;
}
