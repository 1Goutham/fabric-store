import { ArrowUpRight } from "lucide-react";
import { BRAND } from "@/lib/constants";
import { cn } from "@/lib/client/cn";

/**
 * Creator signature, one quiet line:
 *   © 2026 FabricNest · A product by 1Goutham ↗
 */
export function Signature({ className, muted = true, copyright = true }: { className?: string; muted?: boolean; copyright?: boolean }) {
  return (
    <p className={cn("inline-flex flex-wrap items-center gap-x-1.5 text-[12px] tracking-wide", muted ? "text-fg-faint" : "text-fg-muted", className)}>
      {copyright && (
        <>
          <span>© {new Date().getFullYear()} {BRAND.name}</span>
          <span aria-hidden>·</span>
        </>
      )}
      <span>A product by</span>
      <a href={BRAND.creatorUrl} target="_blank" rel="noreferrer" className="group inline-flex items-center gap-0.5 font-medium text-fg-soft transition-colors hover:text-fg">
        1Goutham
        <ArrowUpRight className="h-3 w-3 transition-transform duration-300 group-hover:-translate-y-px group-hover:translate-x-px" aria-hidden />
      </a>
    </p>
  );
}
