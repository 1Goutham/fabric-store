"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/client/cn";
import { useUI } from "@/lib/store/ui";
import { api, messageOf } from "@/lib/client/api";
import type { ProductCard } from "@/types";
import { Sheet } from "@/components/ui/sheet";
import { ProductImage } from "@/components/commerce/product-image";
import { SaveButton } from "@/components/commerce/save-button";
import { formatPrice } from "@/lib/client/format";
import { useIsDesktop } from "@/hooks/use-media";
import { isFocusedRoute } from "@/components/layout/site-header";

interface Reply {
  mode: string;
  reply: string;
  products: ProductCard[];
  reasons: Record<string, string>;
  suggestions: string[];
  compare?: { product: ProductCard; material: string | null; fit: string; moods: string[]; verdict: string }[] | null;
  source: "rules" | "gemini";
}
interface Turn {
  id: number;
  question: string;
  reply: Reply | null;
  error?: string;
}

const OPENERS = ["Find something for a date", "Something relaxed for a summer day", "Minimal black shirt under ₹2,000", "Help me choose a shirt"];
const CONTEXT_OPENERS = ["Show similar styles", "Build an outfit around this", "Something cheaper like this", "Is this good for summer?"];

/**
 * "Ask FabricNest": a contextual shopping assistant. Every reply is products
 * first, one line of stylist copy second.
 */
export function AssistantPanel() {
  const open = useUI((s) => s.assistantOpen);
  const close = useUI((s) => s.closeAssistant);
  const ctx = useUI((s) => s.assistantContext);
  const pathname = usePathname();
  const desktop = useIsDesktop();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && ctx.prefill) {
      setInput(ctx.prefill);
    }
  }, [open, ctx.prefill]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, busy]);

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q || busy) return;
    const id = Date.now();
    setTurns((t) => [...t, { id, question: q, reply: null }]);
    setInput("");
    setBusy(true);
    try {
      const reply = await api.post<Reply>("/api/assistant", { message: q, context: { productId: ctx.productId ?? null, page: pathname, candidateIds: ctx.candidateIds } });
      setTurns((t) => t.map((x) => (x.id === id ? { ...x, reply } : x)));
    } catch (err) {
      setTurns((t) => t.map((x) => (x.id === id ? { ...x, error: messageOf(err, "The assistant is unavailable right now.") } : x)));
    } finally {
      setBusy(false);
    }
  };

  const openers = ctx.productId ? CONTEXT_OPENERS : OPENERS;

  return (
    <Sheet open={open} onClose={close} side={desktop ? "right" : "bottom"} hideHeader width="max-w-[480px]" className={cn(!desktop && "h-[88dvh]")}>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between px-5 pt-5 md:px-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <h2 className="headline text-lg">Ask FabricNest</h2>
          </div>
          <button onClick={close} className="text-[13px] text-fg-muted hover:text-fg">
            Close
          </button>
        </div>
        <p className="px-5 pt-1 text-[13px] text-fg-muted md:px-6">{ctx.productId ? "Asking about the piece you're viewing." : "Describe the moment, the mood or the budget."}</p>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-5 md:px-6">
          {turns.length === 0 && (
            <div className="flex flex-col gap-2 pt-2">
              {openers.map((o) => (
                <button key={o} onClick={() => ask(o)} className="tactile w-fit rounded-full border border-line px-4 py-2 text-left text-[14px] text-fg-soft hover:border-line-strong hover:text-fg">
                  {o}
                </button>
              ))}
            </div>
          )}
          <div className="flex flex-col gap-7">
            {turns.map((t) => (
              <div key={t.id} className="rise-in">
                <p className="ml-auto w-fit max-w-[85%] rounded-[var(--r-lg)] rounded-br-md bg-white/[0.07] px-4 py-2.5 text-[14px] text-fg">{t.question}</p>
                <div className="mt-4">
                  {t.error ? (
                    <p className="text-[14px] text-danger">{t.error}</p>
                  ) : !t.reply ? (
                    <div className="flex items-center gap-2 text-[13px] text-fg-muted">
                      <span className="flex gap-1" aria-hidden>
                        {[0, 1, 2].map((i) => (
                          <span key={i} className="h-1.5 w-1.5 animate-pulse rounded-full bg-fg-muted" style={{ animationDelay: `${i * 150}ms` }} />
                        ))}
                      </span>
                      Looking through the catalogue
                    </div>
                  ) : (
                    <>
                      <p className="text-[15px] leading-relaxed text-fg">{t.reply.reply}</p>
                      {t.reply.products.length > 0 && (
                        <ul className="mt-4 grid grid-cols-2 gap-3">
                          {t.reply.products.slice(0, 6).map((p) => (
                            <li key={p.id} className="group relative">
                              <Link href={`/products/${p.slug}`} onClick={close} className="block overflow-hidden rounded-[var(--r-lg)]">
                                <div className="relative aspect-[4/5]">
                                  <ProductImage src={p.image?.url} alt={p.name} sizes="200px" fallbackHex={p.colors[0]?.hex} className="absolute inset-0 transition-transform duration-700 group-hover:scale-[1.03]" />
                                </div>
                              </Link>
                              <div className="absolute right-2 top-2">
                                <SaveButton product={p} size="sm" />
                              </div>
                              <div className="mt-2">
                                <p className="truncate text-[13px] text-fg">{p.name}</p>
                                <p className="meta flex items-center justify-between gap-2">
                                  <span className="truncate">{t.reply?.reasons[p.id] ?? p.fabric}</span>
                                  <span className="tabular shrink-0 text-fg-soft">{formatPrice(p.price)}</span>
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                      {t.reply.compare && t.reply.compare.length > 1 && (
                        <div className="mt-4 overflow-x-auto rounded-[var(--r-lg)] border border-line">
                          <table className="w-full text-[12px]">
                            <tbody className="divide-y divide-line">
                              {[
                                ["Price", (r: NonNullable<Reply["compare"]>[number]) => formatPrice(r.product.price)],
                                ["Fabric", (r: NonNullable<Reply["compare"]>[number]) => r.product.fabric],
                                ["Fit", (r: NonNullable<Reply["compare"]>[number]) => r.fit],
                                ["Mood", (r: NonNullable<Reply["compare"]>[number]) => r.moods.join(", ") || "—"],
                                ["Verdict", (r: NonNullable<Reply["compare"]>[number]) => r.verdict],
                              ].map(([label, fn]) => (
                                <tr key={label as string}>
                                  <th scope="row" className="px-3 py-2 text-left font-normal text-fg-muted">{label as string}</th>
                                  {t.reply!.compare!.map((r) => (
                                    <td key={r.product.id} className="px-3 py-2 capitalize text-fg-soft">{(fn as (r: NonNullable<Reply["compare"]>[number]) => string)(r)}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      {t.reply.suggestions.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {t.reply.suggestions.map((s) => (
                            <button key={s} onClick={() => ask(s)} className="tactile rounded-full border border-line px-3 py-1.5 text-[12px] text-fg-muted hover:border-line-strong hover:text-fg">
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
          className="glass glass-strong pb-safe sticky bottom-0 rounded-none border-x-0 border-b-0 px-4 py-3 md:px-5"
        >
          <div className="flex items-center gap-2 rounded-full border border-line bg-surface/70 pl-4 pr-1.5">
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={ctx.productId ? "Ask about this piece…" : "Ask for anything…"} aria-label="Ask FabricNest" className="h-11 w-full min-w-0 bg-transparent text-[15px] text-fg placeholder:text-fg-faint focus:outline-none" data-autofocus />
            <button type="submit" disabled={!input.trim() || busy} aria-label="Send" className="tactile flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-fg text-bg disabled:opacity-30">
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-center text-[11px] text-fg-faint">Answers come from the live catalogue. Rules-based with an optional model upgrade; never invented products.</p>
        </form>
      </div>
    </Sheet>
  );
}

/** Floating entry point; hidden on admin and checkout. */
export function AskFab() {
  const openAssistant = useUI((s) => s.openAssistant);
  const pathname = usePathname();
  if (pathname.startsWith("/admin") || isFocusedRoute(pathname)) return null;
  return (
    <button onClick={() => openAssistant({ page: pathname })} className="tactile glass fixed bottom-[calc(var(--tabbar-h)+16px)] right-4 z-[55] inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm text-fg md:bottom-6 md:right-8" aria-label="Ask FabricNest">
      <Sparkles className="h-4 w-4 text-accent" />
      <span>Ask</span>
    </button>
  );
}
