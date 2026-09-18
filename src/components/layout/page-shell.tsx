import { cn } from "@/lib/client/cn";

/** Standard page padding below the fixed header and above the mobile tab bar. */
export function PageShell({ children, className, wide }: { children: React.ReactNode; className?: string; wide?: boolean }) {
  return (
    <main className={cn("mx-auto w-full px-5 pt-[calc(var(--nav-h)+24px)] pb-[calc(var(--tabbar-h)+24px)] md:px-10 md:pt-[calc(var(--nav-h)+40px)] md:pb-16", wide ? "max-w-[1600px]" : "max-w-[var(--content-max)]", className)}>{children}</main>
  );
}
