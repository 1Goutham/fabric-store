"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/client/cn";
import type { ProductImage as Img } from "@/types";
import { ProductImage } from "./product-image";
import { useReducedMotion } from "@/hooks/use-media";

/**
 * Desktop: large stage with hover-zoom and crossfade between shots, thumbnails
 * alongside. Mobile: a swipeable snap rail with dots. Never distorts an image.
 */
export function ProductGallery({ images, name, fallbackHex }: { images: Img[]; name: string; fallbackHex?: string }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const list = images.length ? images : [{ url: "", alt: name }];

  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    const on = () => setIndex(Math.round(el.scrollLeft / el.clientWidth));
    el.addEventListener("scroll", on, { passive: true });
    return () => el.removeEventListener("scroll", on);
  }, []);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reduced) return;
    const r = e.currentTarget.getBoundingClientRect();
    setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };

  return (
    <div className="w-full">
      {/* Mobile rail */}
      <div className="md:hidden">
        <div ref={railRef} className="rail scrollbar-hide -mx-5 aspect-[4/5] w-[calc(100%+40px)]" aria-roledescription="carousel" aria-label={`${name} photos`}>
          {list.map((img, i) => (
            <div key={i} className="relative w-full shrink-0" aria-roledescription="slide" aria-label={`${i + 1} of ${list.length}`}>
              <ProductImage src={img.url} alt={img.alt || name} sizes="100vw" priority={i === 0} fallbackHex={fallbackHex} className="absolute inset-0" />
            </div>
          ))}
        </div>
        {list.length > 1 && (
          <div className="mt-3 flex justify-center gap-1.5" aria-hidden>
            {list.map((_, i) => (
              <span key={i} className={cn("h-1 rounded-full transition-all duration-300", i === index ? "w-5 bg-fg" : "w-1.5 bg-fg/25")} />
            ))}
          </div>
        )}
      </div>

      {/* Desktop stage */}
      <div className="hidden gap-4 md:grid md:grid-cols-[72px_1fr]">
        <div className="flex flex-col gap-2" role="tablist" aria-label="Product photos">
          {list.map((img, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === index}
              aria-label={`Photo ${i + 1}`}
              onMouseEnter={() => setIndex(i)}
              onClick={() => setIndex(i)}
              className={cn("relative aspect-[4/5] overflow-hidden rounded-[var(--r-md)] border transition-colors", i === index ? "border-fg/60" : "border-transparent opacity-60 hover:opacity-100")}
            >
              <ProductImage src={img.url} alt="" sizes="72px" fallbackHex={fallbackHex} className="absolute inset-0" />
            </button>
          ))}
        </div>
        <div className="relative aspect-[4/5] cursor-zoom-in overflow-hidden rounded-[var(--r-xl)] bg-surface" onMouseMove={onMove} onMouseLeave={() => setZoom(null)}>
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.45, ease: "easeOut" }}
              className="absolute inset-0"
              style={zoom ? { transform: "scale(1.8)", transformOrigin: `${zoom.x}% ${zoom.y}%`, transition: "transform 0.25s ease-out" } : { transform: "scale(1)", transition: "transform 0.45s var(--ease-out-expo)" }}
            >
              <ProductImage src={list[index].url} alt={list[index].alt || name} sizes="(max-width: 1024px) 60vw, 720px" priority={index === 0} fallbackHex={fallbackHex} className="absolute inset-0" />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
