"use client";
import { useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/client/cn";
import type { ProductCard as ProductCardType } from "@/types";
import { ProductCard } from "./product-card";
import { IconButton } from "@/components/ui/button";

/** Horizontal, snap-scrolling product rail with keyboard-accessible arrows on desktop. */
export function ProductRail({ products, reasons, className, itemClassName }: { products: ProductCardType[]; reasons?: Record<string, string>; className?: string; itemClassName?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const scrollBy = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * Math.min(ref.current.clientWidth * 0.8, 900), behavior: "smooth" });
  if (products.length === 0) return null;
  return (
    <div className={cn("relative", className)}>
      <div ref={ref} className="rail scrollbar-hide -mx-5 gap-4 px-5 md:-mx-10 md:gap-6 md:px-10" tabIndex={0} aria-label="Products">
        {products.map((p) => (
          <div key={p.id} className={cn("w-[62vw] xs:w-[52vw] sm:w-[40vw] md:w-[30vw] lg:w-[22vw] xl:w-[300px]", itemClassName)}>
            <ProductCard product={p} reason={reasons?.[p.id]} sizes="(max-width: 640px) 60vw, (max-width: 1024px) 33vw, 300px" />
          </div>
        ))}
      </div>
      {products.length > 3 && (
        <div className="absolute -top-14 right-0 hidden gap-2 md:flex">
          <IconButton label="Scroll left" variant="glass" size="sm" onClick={() => scrollBy(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </IconButton>
          <IconButton label="Scroll right" variant="glass" size="sm" onClick={() => scrollBy(1)}>
            <ArrowRight className="h-4 w-4" />
          </IconButton>
        </div>
      )}
    </div>
  );
}
