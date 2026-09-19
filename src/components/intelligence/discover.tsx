"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/client/cn";
import { api, messageOf } from "@/lib/client/api";
import type { DiscoverResult } from "@/types";
import { ProductGrid, ProductGridSkeleton } from "@/components/commerce/product-grid";
import { EmptyState } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { useRecentSearches } from "@/hooks/use-recent-searches";
import { useUI } from "@/lib/store/ui";

const PROMPTS = [
  "I need a minimal black shirt under ₹2,000",
  "Something relaxed for a summer day",
  "Find something for a casual dinner",
  "Pleated trousers I can wear to work",
  "Linen, cream or sand, under ₹3,000",
  "Warm layers for a trip in December",
];

function intentChips(r: DiscoverResult) {
  const i = r.intent;
  const chips: string[] = [];
  i.categories.forEach((c) => chips.push(c.replace(/-/g, " ")));
  i.fabrics.forEach((f) => chips.push(f));
  i.colors.forEach((c) => chips.push(c));
  i.moods.forEach((m) => chips.push(m));
  i.occasions.forEach((o) => chips.push(`for ${o}`));
  i.seasons.forEach((s) => chips.push(s));
  i.fits.forEach((f) => chips.push(`${f} fit`));
  i.sizes.forEach((s) => chips.push(`size ${s}`));
  if (i.priceMax !== null && i.priceMin !== null) chips.push(`₹${i.priceMin.toLocaleString("en-IN")}–₹${i.priceMax.toLocaleString("en-IN")}`);
  else if (i.priceMax !== null) chips.push(`under ₹${i.priceMax.toLocaleString("en-IN")}`);
  else if (i.priceMin !== null) chips.push(`over ₹${i.priceMin.toLocaleString("en-IN")}`);
  if (i.gender) chips.push(i.gender);
  return chips;
}

/**
 * Discover: intent → understanding → retrieval → ranking → results.
 * The parsed intent is shown back to the shopper as chips, so the system's
 * understanding is visible and correctable.
 */
export function Discover({ initialQuery, initialResult }: { initialQuery: string; initialResult: DiscoverResult | null }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(initialQuery);
  const [result, setResult] = useState<DiscoverResult | null>(initialResult);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { push } = useRecentSearches();
  const openAssistant = useUI((s) => s.openAssistant);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastRun = useRef(initialQuery);

  const run = async (query: string) => {
    const t = query.trim();
    if (!t) return;
    setLoading(true);
    setError(null);
    lastRun.current = t;
    push(t);
    router.replace(`/discover?q=${encodeURIComponent(t)}`, { scroll: false });
    try {
      const r = await api.post<DiscoverResult>("/api/discover", { query: t });
      setResult(r);
    } catch (err) {
      setError(messageOf(err, "We couldn't run that search. Try again."));
    } finally {
      setLoading(false);
    }
  };

  // Back/forward and in-app links to /discover?q=
  useEffect(() => {
    const urlQ = params.get("q") ?? "";
    if (urlQ && urlQ !== lastRun.current) {
      setQ(urlQ);
      void run(urlQ);
    }
  }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

  const chips = result ? intentChips(result) : [];

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(q);
        }}
        className="relative"
      >
        <label htmlFor="discover-input" className="sr-only">
          Describe what you&rsquo;re looking for
        </label>
        <div className="glass flex items-center gap-3 rounded-[var(--r-xl)] py-2 pl-5 pr-2">
          <Sparkles className="h-5 w-5 shrink-0 text-accent" aria-hidden />
          <input id="discover-input" ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Describe it. A mood, a moment, a budget." className="h-12 w-full min-w-0 bg-transparent text-[17px] text-fg placeholder:text-fg-faint focus:outline-none md:text-xl" autoComplete="off" />
          <button type="submit" disabled={!q.trim() || loading} aria-label="Discover" className="tactile flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-fg text-bg disabled:opacity-30">
            <ArrowUp className="h-4.5 w-4.5" />
          </button>
        </div>
      </form>

      {!result && !loading && (
        <div className="mt-6 flex flex-wrap gap-2">
          {PROMPTS.map((p) => (
            <button key={p} onClick={() => { setQ(p); run(p); }} className="tactile rounded-full border border-line px-4 py-2 text-[14px] text-fg-soft hover:border-line-strong hover:text-fg">
              {p}
            </button>
          ))}
        </div>
      )}

      <div className="mt-10" aria-live="polite" aria-busy={loading}>
        {loading ? (
          <>
            <div className="skeleton mb-8 h-4 w-72" />
            <ProductGridSkeleton count={8} />
          </>
        ) : error ? (
          <EmptyState title="Something went wrong." description={error} action={<Button variant="secondary" onClick={() => run(lastRun.current)}>Retry</Button>} />
        ) : result ? (
          <>
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-[15px] text-fg-soft">
                  {result.intent.summary ?? (chips.length ? "Understood as" : "Showing")}{" "}
                  {chips.length > 0 && (
                    <span className="mt-2 flex flex-wrap gap-1.5">
                      {chips.map((c) => (
                        <span key={c} className="rounded-full bg-white/[0.07] px-2.5 py-1 text-[12px] capitalize text-fg">
                          {c}
                        </span>
                      ))}
                    </span>
                  )}
                </p>
                {result.note && <p className="mt-3 max-w-xl text-[14px] text-fg-muted">{result.note}</p>}
              </div>
              <div className="flex items-center gap-4">
                <span className="meta tabular whitespace-nowrap">
                  {result.total} {result.total === 1 ? "piece" : "pieces"} · {result.intent.source === "gemini" ? "model-assisted" : "rules-based"}
                </span>
                <button onClick={() => openAssistant({ prefill: `Help me choose: ${result.intent.query}` })} className="link-underline whitespace-nowrap text-[13px] text-fg-soft hover:text-fg">
                  Help me choose
                </button>
              </div>
            </div>
            {result.products.length === 0 ? (
              <EmptyState title="We couldn't find an exact match." description="Try loosening the price or colour, or describe the occasion instead." action={<Button variant="secondary" onClick={() => { setResult(null); inputRef.current?.focus(); }}>Start again</Button>} />
            ) : (
              <ProductGrid products={result.products} reasons={result.reasons} />
            )}
          </>
        ) : (
          <div className={cn("grid gap-8 border-t border-line pt-10 md:grid-cols-3")}>
            {[
              ["Intent", "Say it the way you'd say it to a friend. Price, colour, occasion, fabric, fit."],
              ["Understanding", "The request becomes structured filters. You see them, so you can trust them."],
              ["Ranking", "Products are scored on how well they match, then nudged by what you tend to like."],
            ].map(([t, d]) => (
              <div key={t}>
                <p className="eyebrow mb-2">{t}</p>
                <p className="text-[15px] leading-relaxed text-fg-muted">{d}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
