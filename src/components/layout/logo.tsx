import Link from "next/link";
import { cn } from "@/lib/client/cn";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} aria-label="FabricNest home" className={cn("group inline-flex items-center gap-2 font-display text-[17px] font-medium tracking-[-0.02em] text-fg", className)}>
      <span aria-hidden className="relative block h-[18px] w-[18px]">
        {/* Two folded planes: a nest of fabric. */}
        <span className="absolute inset-0 rounded-[5px] border border-fg/70 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:-rotate-6" />
        <span className="absolute inset-[3px] rounded-[3px] bg-fg/85 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:rotate-6" />
      </span>
      <span>
        Fabric<span className="text-fg-muted">Nest</span>
      </span>
    </Link>
  );
}
