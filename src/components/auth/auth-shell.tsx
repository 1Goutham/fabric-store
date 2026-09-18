import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { Signature } from "@/components/layout/signature";

/** Auth pages: one column, a quiet frame, the signature at the bottom. */
export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col bg-bg">
      <header className="mx-auto flex h-[var(--nav-h)] w-full max-w-5xl items-center justify-between px-5 md:px-8">
        <Logo />
        <Link href="/shop" className="text-[13px] text-fg-muted hover:text-fg">
          Continue browsing
        </Link>
      </header>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-12">
        <h1 className="display text-4xl md:text-5xl">{title}</h1>
        {subtitle && <p className="mt-3 text-[15px] text-fg-muted">{subtitle}</p>}
        <div className="mt-8">{children}</div>
        {footer && <div className="mt-8 text-[14px] text-fg-muted">{footer}</div>}
      </div>
      <footer className="mx-auto w-full max-w-5xl px-5 pb-8 md:px-8">
        <Signature />
      </footer>
    </main>
  );
}
