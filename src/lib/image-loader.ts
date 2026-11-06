/**
 * next/image loader. Images are served straight from their own CDN instead of
 * Vercel's optimizer (/_next/image), which fails on free-plan limits and on
 * any host not listed in next.config — and a failed optimisation leaves only
 * the colour swatch on screen.
 *
 * Unsplash resizes on its own CDN, so we ask it for the exact width and let it
 * pick AVIF/WebP. Any other host gets the original URL.
 */
export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }): string {
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return src; // relative path or malformed value: hand it to the browser as-is
  }
  if (url.hostname === "images.unsplash.com" || url.hostname === "plus.unsplash.com") {
    url.searchParams.set("auto", "format");
    url.searchParams.set("fit", "crop");
    url.searchParams.set("w", String(width));
    url.searchParams.set("q", String(quality ?? 75));
    return url.toString();
  }
  return src;
}
