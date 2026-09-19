"use client";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/client/cn";
import type { Pagination as PaginationType } from "@/types";

interface Props {
  pagination: PaginationType;
  /** Path the page links point at, e.g. "/shop". */
  basePath: string;
  /** Current query params to preserve (page is replaced). */
  params?: Record<string, string | undefined>;
  className?: string;
}

/** URL-driven pagination. Serialisable props only, so it can be rendered from Server Components. */
export function Pagination({ pagination, basePath, params = {}, className }: Props) {
  const { page, totalPages } = pagination;
  if (totalPages <= 1) return null;
  const hrefFor = (p: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "" && k !== "page") sp.set(k, v);
    if (p > 1) sp.set("page", String(p));
    const s = sp.toString();
    return `${basePath}${s ? `?${s}` : ""}`;
  };
  const pages = new Set<number>([1, totalPages, page, page - 1, page + 1]);
  const list = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  return (
    <nav aria-label="Pagination" className={cn("flex items-center justify-center gap-1", className)}>
      <PageLink href={hrefFor(page - 1)} disabled={page <= 1} label="Previous page">
        <ArrowLeft className="h-4 w-4" />
      </PageLink>
      {list.map((p, i) => (
        <span key={p} className="flex items-center">
          {i > 0 && list[i - 1] !== p - 1 && <span className="px-1 text-fg-faint">…</span>}
          <PageLink href={hrefFor(p)} current={p === page} label={`Page ${p}`}>
            {p}
          </PageLink>
        </span>
      ))}
      <PageLink href={hrefFor(page + 1)} disabled={page >= totalPages} label="Next page">
        <ArrowRight className="h-4 w-4" />
      </PageLink>
    </nav>
  );
}

function PageLink({ href, children, disabled, current, label }: { href: string; children: React.ReactNode; disabled?: boolean; current?: boolean; label: string }) {
  const cls = cn("tabular flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm transition-colors", current ? "bg-fg text-bg" : "text-fg-muted hover:bg-white/[0.06] hover:text-fg", disabled && "pointer-events-none opacity-30");
  if (disabled) return <span className={cls}>{children}</span>;
  return (
    <Link href={href} aria-label={label} aria-current={current ? "page" : undefined} className={cls} scroll>
      {children}
    </Link>
  );
}
