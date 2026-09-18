import { cn } from "@/lib/client/cn";
import type { ProductCard as ProductCardType } from "@/types";
import { ProductCard, ProductCardSkeleton } from "./product-card";

export function ProductGrid({ products, reasons, className, columns = 4, priorityCount = 4 }: { products: ProductCardType[]; reasons?: Record<string, string>; className?: string; columns?: 3 | 4; priorityCount?: number }) {
  return (
    <div className={cn("grid grid-cols-2 gap-x-4 gap-y-9 md:gap-x-6", columns === 4 ? "lg:grid-cols-4 md:grid-cols-3" : "md:grid-cols-3", className)}>
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} reason={reasons?.[p.id]} priority={i < priorityCount} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8, columns = 4 }: { count?: number; columns?: 3 | 4 }) {
  return (
    <div className={cn("grid grid-cols-2 gap-x-4 gap-y-9 md:gap-x-6", columns === 4 ? "lg:grid-cols-4 md:grid-cols-3" : "md:grid-cols-3")}>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
