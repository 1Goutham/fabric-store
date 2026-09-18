"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Clock, Search, Sparkles, X } from "lucide-react";
import { useUI } from "@/lib/store/ui";
import { api } from "@/lib/client/api";
import { useRecentSearches } from "@/hooks/use-recent-searches";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import { useReducedMotion } from "@/hooks/use-media";
import type { ProductCard, ShoppingIntent } from "@/types";
import { ProductImage } from "@/components/commerce/product-image";
import { formatPrice } from "@/lib/client/format";

const SUGGESTED = ["Minimal black shirt under ₹2,000", "Something relaxed for a summer day", "Linen for the weekend", "Pleated trousers for work", "Find something for a dinner"];

interface Result {
  products: ProductCard[];
  categories: { name: string; slug: string }[];
  intent: ShoppingIntent | null;
  summary: string | null;
  note: string | null;
}

/** Full-screen glass search. Instant results as you type; Enter goes to Discover for natural language. */
export function SearchOverlay() {
  const open = useUI((s) => s.searchOpen);
  const setOpen = useUI((s) => s.setSearchOpen);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const { recent, push, clear } = useRecentSearches();
  const reduced = useReducedMotion();
  useScrollLock(open);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 40);
    else {
      setQ("");
      setResult(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResult(null);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await api.get<Result>(`/api/search?q=${encodeURIComponent(q.trim())}`, { signal: ctrl.signal });
        setResult(r);
      } catch {
        /* aborted or failed: keep last */
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  const go = (query: string) => {
    const t = query.trim();
    if (!t) return;
    push(t);
    setOpen(false);
    router.push(`/discover?q=${encodeURIComponent(t)}`);
  };

  const isNatural = (result?.intent && (result.intent.priceMax !== null || result.intent.moods.length || result.intent.occasions.length || result.intent.seasons.length)) || q.trim().split(/\s+/).length > 3;

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.2 }} className="fixed inset-0 z-[85] bg-bg/80 backdrop-blur-2xl" role="dialog" aria-modal="true" aria-label="Search FabricNest">
          <div className="mx-auto flex h-full max-w-3xl flex-col px-5 pt-5 md:pt-14">
            <div className="flex items-center justify-between">
              <p className="eyebrow">Search FabricNest</p>
              <button onClick={() => setOpen(false)} aria-label="Close search" className="tactile flex h-10 w-10 items-center justify-center rounded-full text-fg-soft hover:bg-white/[0.06] hover:text-fg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                go(q);
              }}
              className="mt-6 flex items-center gap-3 border-b border-line-strong pb-3"
            >
              <Search className="h-5 w-5 shrink-0 text-fg-muted" aria-hidden />
              <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="What are you looking for?" aria-label="Search" autoComplete="off" className="w-full min-w-0 bg-transparent font-display text-2xl tracking-[-0.02em] text-fg placeholder:text-fg-faint focus:outline-none md:text-3xl" />
              {q && (
                <button type="submit" className="tactile flex h-10 shrink-0 items-center gap-2 rounded-full bg-fg px-4 text-sm text-bg">
                  {isNatural ? <Sparkles className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                  <span className="hidden sm:inline">{isNatural ? "Discover" : "Search"}</span>
                </button>
              )}
            </form>

            <div className="scrollbar-hide mt-6 flex-1 overflow-y-auto pb-24">
              {!q.trim() ? (
                <div className="grid gap-10 md:grid-cols-2">
                  {recent.length > 0 && (
                    <section>
                      <div className="mb-3 flex items-center justify-between">
                        <p className="eyebrow">Recent</p>
                        <button onClick={clear} className="text-[12px] text-fg-muted hover:text-fg">
                          Clear
                        </button>
                      </div>
                      <ul className="space-y-1">
                        {recent.map((r) => (
                          <li key={r}>
                            <button onClick={() => go(r)} className="group flex w-full items-center gap-3 rounded-[var(--r-md)] px-2 py-2 text-left text-[15px] text-fg-soft hover:bg-white/[0.05] hover:text-fg">
                              <Clock className="h-4 w-4 text-fg-faint" /> {r}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                  <section>
                    <p className="eyebrow mb-3">Try asking</p>
                    <ul className="space-y-1">
                      {SUGGESTED.map((s) => (
                        <li key={s}>
                          <button onClick={() => go(s)} className="group flex w-full items-center gap-3 rounded-[var(--r-md)] px-2 py-2 text-left text-[15px] text-fg-soft hover:bg-white/[0.05] hover:text-fg">
                            <Sparkles className="h-4 w-4 text-fg-faint" /> {s}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>
              ) : (
                <div className="space-y-8">
                  {result?.summary && (
                    <p className="text-sm text-fg-muted">
                      Understood as <span className="text-fg">{result.summary}</span>
                      {result.note && <span className="mt-1 block text-[13px] text-fg-faint">{result.note}</span>}
                    </p>
                  )}
                  {result && result.categories.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {result.categories.map((c) => (
                        <Link key={c.slug} href={`/shop?category=${c.slug}`} onClick={() => setOpen(false)} className="tactile inline-flex h-9 items-center rounded-full border border-line px-3.5 text-[13px] text-fg-soft hover:border-line-strong hover:text-fg">
                          {c.name}
                        </Link>
                      ))}
                    </div>
                  )}
                  <ul className="divide-y divide-line" aria-live="polite" aria-busy={loading}>
                    {result?.products.map((p) => (
                      <li key={p.id}>
                        <Link href={`/products/${p.slug}`} onClick={() => setOpen(false)} className="group flex items-center gap-4 py-3">
                          <ProductImage src={p.image?.url} alt="" sizes="56px" fallbackHex={p.colors[0]?.hex} className="h-16 w-14 shrink-0 rounded-[var(--r-md)]" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[15px] text-fg group-hover:text-fg-soft">{p.name}</p>
                            <p className="meta">
                              {p.fabric} · {p.categorySlug.replace(/-/g, " ")}
                            </p>
                          </div>
                          <span className="tabular text-sm text-fg-soft">{formatPrice(p.price)}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {result && result.products.length === 0 && !loading && (
                    <div className="py-6">
                      <p className="text-[15px] text-fg-soft">We couldn&rsquo;t find an exact match.</p>
                      <button onClick={() => go(q)} className="mt-2 inline-flex items-center gap-2 text-sm text-accent">
                        <Sparkles className="h-4 w-4" /> Let Discover interpret &ldquo;{q}&rdquo;
                      </button>
                    </div>
                  )}
                  {result && result.products.length > 0 && (
                    <button onClick={() => go(q)} className="link-underline inline-flex items-center gap-2 text-sm text-fg-soft hover:text-fg">
                      See all results for &ldquo;{q}&rdquo; <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
