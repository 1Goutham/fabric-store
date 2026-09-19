import { BRAND } from "@/lib/constants";
import { cn } from "@/lib/client/cn";

/** Creator signature. Quiet by design: a byline, not a banner. */
export function Signature({ className, muted = true }: { className?: string; muted?: boolean }) {
  return (
    <p className={cn("inline-flex items-center gap-2 text-[12px] tracking-wide", muted ? "text-fg-faint" : "text-fg-muted", className)}>
      <span>{BRAND.signature}</span>
      <span aria-hidden className="h-px w-4 bg-current opacity-50" />
      <a href={BRAND.creatorUrl} target="_blank" rel="noreferrer" className="link-underline hover:text-fg">
        1goutham.space
      </a>
    </p>
  );
}
