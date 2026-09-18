"use client";
import Link from "next/link";
import { cn } from "@/lib/client/cn";
import type { ProductCard as ProductCardType } from "@/types";
import { ProductImage } from "./product-image";
import { SaveButton } from "./save-button";
import { Price } from "@/components/ui/primitives";

interface Props {
  product: ProductCardType;
  reason?: string;
  priority?: boolean;
  className?: string;
  sizes?: string;
  aspect?: "portrait" | "tall";
  compact?: boolean;
}

/**
 * The product card: image first, quiet metadata, hover crossfade to the
 * alternate shot, save on hover (always visible on touch).
 */
export function ProductCard({ product, reason, priority, className, sizes = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw", aspect = "portrait", compact }: Props) {
  const ratio = aspect === "tall" ? "aspect-[3/4]" : "aspect-[4/5]";
  return (
    <article className={cn("group relative flex flex-col", className)}>
      <Link href={`/products/${product.slug}`} className="relative block overflow-hidden rounded-[var(--r-lg)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent" aria-label={product.name}>
        <div className={cn("relative", ratio)}>
          <ProductImage src={product.image?.url} alt={product.image?.alt ?? product.name} sizes={sizes} priority={priority} fallbackHex={product.colors[0]?.hex} className="absolute inset-0 transition-transform duration-[1200ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.03]" />
          {product.hoverImage && (
            <ProductImage src={product.hoverImage.url} alt="" sizes={sizes} fallbackHex={product.colors[0]?.hex} className="absolute inset-0 opacity-0 transition-opacity duration-700 ease-out group-hover:opacity-100 motion-reduce:hidden" />
          )}
          {!product.inStock && (
            <span className="absolute left-3 top-3 rounded-full bg-bg/70 px-2.5 py-1 text-[11px] text-fg-soft backdrop-blur-md">Sold out</span>
          )}
          {product.inStock && product.isNew && <span className="absolute left-3 top-3 rounded-full bg-bg/60 px-2.5 py-1 text-[11px] text-fg-soft backdrop-blur-md">New</span>}
        </div>
      </Link>
      <div className="absolute right-3 top-3 opacity-100 transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
        <SaveButton product={product} size="sm" />
      </div>
      <div className={cn("flex flex-col gap-1 pt-3", compact ? "px-0" : "px-0.5")}>
        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <Link href={`/products/${product.slug}`} className="line-clamp-2 min-w-0 text-[14px] leading-snug text-fg hover:text-fg-soft">
            {product.name}
          </Link>
          <Price amount={product.price} compareAt={product.compareAtPrice} size="sm" className="shrink-0" />
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="meta truncate">{reason ?? `${product.fabric} · ${product.categorySlug.replace(/-/g, " ")}`}</p>
          {product.colors.length > 1 && (
            <span className="flex shrink-0 items-center gap-1" aria-label={`${product.colors.length} colours`}>
              {product.colors.slice(0, 4).map((c) => (
                <span key={c.name} className="h-2.5 w-2.5 rounded-full border border-white/15" style={{ backgroundColor: c.hex }} title={c.name} />
              ))}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton({ aspect = "portrait" }: { aspect?: "portrait" | "tall" }) {
  return (
    <div className="flex flex-col" aria-hidden>
      <div className={cn("skeleton rounded-[var(--r-lg)]", aspect === "tall" ? "aspect-[3/4]" : "aspect-[4/5]")} />
      <div className="mt-3 flex justify-between">
        <div className="skeleton h-3.5 w-2/3" />
        <div className="skeleton h-3.5 w-14" />
      </div>
      <div className="skeleton mt-2 h-3 w-1/3" />
    </div>
  );
}
