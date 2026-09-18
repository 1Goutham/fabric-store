"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import type { ProductCard } from "@/types";
import { ProductImage } from "@/components/commerce/product-image";
import { cn } from "@/lib/client/cn";

/**
 * Editorial hero: one photograph, one line, one action. Copy rises in after
 * fonts are ready so nothing pops mid-swap.
 */
export function HomeHero({ product, tagline }: { product: ProductCard | null; tagline: string }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    const go = () => alive && setReady(true);
    if (document.fonts?.ready) document.fonts.ready.then(go);
    else go();
    const t = setTimeout(go, 500);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, []);

  return (
    <section className="relative isolate min-h-[92dvh] overflow-hidden bg-bg-sunken" aria-label="Featured">
      <div className="absolute inset-0">
        <ProductImage src={product?.image?.url} alt="" sizes="100vw" priority fallbackHex={product?.colors[0]?.hex ?? "#2a2a2e"} className="absolute inset-0" imgClassName="object-cover object-[50%_20%]" />
        <div className="grain absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/40 to-bg/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-bg/70 via-transparent to-transparent" />
      </div>
      <div className="relative mx-auto flex min-h-[92dvh] max-w-[var(--content-max)] flex-col justify-end px-5 pb-20 pt-[var(--nav-h)] md:px-10 md:pb-28">
        <div className="max-w-2xl">
          <p className={cn("eyebrow mb-5 text-white/60", ready ? "rise-in" : "opacity-0")} style={{ animationDelay: "80ms" }}>
            Autumn · Winter
          </p>
          <h1 className={cn("display text-[44px] text-white sm:text-6xl md:text-[84px]", ready ? "rise-in" : "opacity-0")} style={{ animationDelay: "160ms" }}>
            {tagline}
          </h1>
          <p className={cn("mt-5 max-w-md text-[15px] leading-relaxed text-white/70 md:text-[17px]", ready ? "rise-in" : "opacity-0")} style={{ animationDelay: "260ms" }}>
            Fewer, better pieces. Found by describing the day you have, not the filter you need.
          </p>
          <div className={cn("mt-8 flex flex-wrap items-center gap-4", ready ? "rise-in" : "opacity-0")} style={{ animationDelay: "340ms" }}>
            <Link href="/shop" className="tactile inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-[15px] font-medium text-black hover:bg-white/90">
              Explore <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/discover" className="tactile glass inline-flex h-12 items-center rounded-full px-6 text-[15px] text-white">
              Describe what you need
            </Link>
          </div>
        </div>
        {product && (
          <Link href={`/products/${product.slug}`} className={cn("group mt-12 inline-flex w-fit items-center gap-3 text-[13px] text-white/70 hover:text-white md:absolute md:bottom-28 md:right-10 md:mt-0", ready ? "fade-in" : "opacity-0")} style={{ animationDelay: "700ms" }}>
            <span className="h-px w-8 bg-current opacity-60" />
            <span>
              Pictured: <span className="link-underline text-white">{product.name}</span>
            </span>
          </Link>
        )}
      </div>
    </section>
  );
}
