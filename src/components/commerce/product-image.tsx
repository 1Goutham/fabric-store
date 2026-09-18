"use client";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/client/cn";

interface Props {
  src?: string | null;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
  fallbackHex?: string;
  fill?: boolean;
  width?: number;
  height?: number;
}

/**
 * Product photography on a soft swatch in the product's own colour. The swatch
 * is always underneath: it is the blur-up placeholder while loading and the
 * graceful fallback if the image never arrives. Images are never stretched.
 */
export function ProductImage({ src, alt, sizes, priority, className, imgClassName, fallbackHex = "#2a2a2e", fill = true, width, height }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const showImg = Boolean(src) && !failed;

  return (
    <div className={cn(!/\b(absolute|fixed|sticky)\b/.test(className ?? "") && "relative", "overflow-hidden bg-surface", className)} role={showImg ? undefined : "img"} aria-label={showImg ? undefined : alt}>
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: `radial-gradient(120% 90% at 30% 20%, ${fallbackHex}b3 0%, ${fallbackHex}40 45%, transparent 75%), linear-gradient(160deg, #1b1b1e, #0f0f11)` }}
      />
      <div aria-hidden className="grain absolute inset-0" />
      {showImg && (
        <Image
          src={src!}
          alt={alt}
          sizes={sizes}
          priority={priority}
          fill={fill}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          quality={82}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn("img-reveal object-cover", imgClassName)}
          data-loaded={loaded ? "true" : "false"}
          draggable={false}
        />
      )}
    </div>
  );
}
