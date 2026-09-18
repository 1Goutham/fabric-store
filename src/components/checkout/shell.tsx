import Link from "next/link";
import { Lock } from "lucide-react";
import { cn } from "@/lib/client/cn";
import { Logo } from "@/components/layout/logo";
import { Signature } from "@/components/layout/signature";

const STEPS = ["Address", "Delivery", "Payment", "Review"];

/** Focused checkout chrome: no navigation, no distractions, a clear step indicator. */
export function CheckoutShell({ step, children }: { step: number; children: React.ReactNode }) {
  return (
    <main className="min-h-dvh bg-bg">
      <header className="mx-auto flex h-[var(--nav-h)] max-w-5xl items-center justify-between px-5 md:px-8">
        <Logo />
        <span className="inline-flex items-center gap-1.5 text-[12px] text-fg-muted">
          <Lock className="h-3.5 w-3.5" /> Secure checkout
        </span>
      </header>
      <div className="mx-auto max-w-5xl px-5 pb-24 pt-6 md:px-8 md:pt-10">
        <ol className="mb-10 flex items-center gap-2 text-[12px]" aria-label="Checkout steps">
          {STEPS.map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              <span className={cn("flex h-5 w-5 items-center justify-center rounded-full border text-[10px]", i + 1 <= step ? "border-fg bg-fg text-bg" : "border-line text-fg-faint")}>{i + 1}</span>
              <span className={cn(i + 1 === step ? "text-fg" : "text-fg-muted")}>{s}</span>
              {i < STEPS.length - 1 && <span className="mx-1 h-px w-6 bg-line" aria-hidden />}
            </li>
          ))}
        </ol>
        {children}
        <div className="mt-16 flex items-center justify-between text-[12px] text-fg-faint">
          <Link href="/bag" className="hover:text-fg">
            ← Back to bag
          </Link>
          <Signature />
        </div>
      </div>
    </main>
  );
}
