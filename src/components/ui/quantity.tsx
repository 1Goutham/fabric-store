"use client";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/client/cn";

export function QuantityControl({ value, onChange, min = 1, max = 10, size = "md", className }: { value: number; onChange: (v: number) => void; min?: number; max?: number; size?: "sm" | "md"; className?: string }) {
  const h = size === "sm" ? "h-8" : "h-10";
  const w = size === "sm" ? "w-8" : "w-10";
  return (
    <div className={cn("inline-flex items-center rounded-full border border-line", h, className)} role="group" aria-label="Quantity">
      <button type="button" aria-label="Decrease quantity" disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))} className={cn("tactile flex items-center justify-center rounded-full text-fg-soft hover:text-fg disabled:opacity-30", h, w)}>
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="tabular min-w-6 text-center text-sm" aria-live="polite">
        {value}
      </span>
      <button type="button" aria-label="Increase quantity" disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))} className={cn("tactile flex items-center justify-center rounded-full text-fg-soft hover:text-fg disabled:opacity-30", h, w)}>
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
