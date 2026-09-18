"use client";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import Link from "next/link";
import { cn } from "@/lib/client/cn";

type Variant = "primary" | "secondary" | "ghost" | "glass" | "danger";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  href?: string;
  full?: boolean;
}

const base =
  "tactile inline-flex items-center justify-center gap-2 rounded-full font-medium whitespace-nowrap select-none disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const variants: Record<Variant, string> = {
  primary: "bg-fg text-bg hover:bg-white",
  secondary: "border border-line-strong text-fg hover:border-fg/40 hover:bg-white/[0.04]",
  ghost: "text-fg-soft hover:text-fg hover:bg-white/[0.05]",
  glass: "glass text-fg hover:bg-white/[0.08]",
  danger: "border border-danger/40 text-danger hover:bg-danger/10",
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-11 px-6 text-sm",
  lg: "h-13 px-8 text-[15px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, href, full, className, children, disabled, ...rest },
  ref
) {
  const cls = cn(base, variants[variant], sizes[size], full && "w-full", className);
  if (href) {
    return (
      <Link href={href} className={cls} aria-disabled={disabled || loading}>
        {children}
      </Link>
    );
  }
  return (
    <button ref={ref} className={cls} disabled={disabled || loading} aria-busy={loading} {...rest}>
      {loading && <Spinner className="h-4 w-4" />}
      <span className={cn("inline-flex items-center gap-2", loading && "opacity-80")}>{children}</span>
    </button>
  );
});

export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("animate-spin", className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export const IconButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { label: string; size?: "sm" | "md"; variant?: "ghost" | "glass" | "solid" }>(
  function IconButton({ label, size = "md", variant = "ghost", className, children, ...rest }, ref) {
    return (
      <button
        ref={ref}
        aria-label={label}
        title={label}
        className={cn(
          "tactile inline-flex items-center justify-center rounded-full text-fg-soft hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          size === "sm" ? "h-9 w-9" : "h-10 w-10",
          variant === "ghost" && "hover:bg-white/[0.06]",
          variant === "glass" && "glass",
          variant === "solid" && "bg-fg text-bg hover:bg-white",
          className
        )}
        {...rest}
      >
        {children}
      </button>
    );
  }
);
