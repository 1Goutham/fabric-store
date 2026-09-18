/**
 * Sliding-window in-memory rate limiter. Adequate for a single Vercel region
 * and for local development; swap the store for Upstash/Redis for multi-instance.
 */
const buckets = new Map<string, number[]>();
let sweepAt = Date.now();

export function rateLimit(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number } {
  const now = Date.now();
  if (now - sweepAt > windowMs * 4) {
    for (const [k, hits] of buckets) if (hits.every((t) => now - t > windowMs)) buckets.delete(k);
    sweepAt = now;
  }
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  hits.push(now);
  buckets.set(key, hits);
  return { allowed: hits.length <= limit, remaining: Math.max(0, limit - hits.length) };
}
