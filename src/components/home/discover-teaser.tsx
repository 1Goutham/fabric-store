"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, Sparkles } from "lucide-react";

const EXAMPLES = ["Something relaxed for a summer day", "A minimal black shirt under ₹2,000", "Find something for a casual dinner", "Build an outfit around linen trousers"];

export function DiscoverTeaser() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const go = (t: string) => t.trim() && router.push(`/discover?q=${encodeURIComponent(t.trim())}`);
  return (
    <section aria-labelledby="discover-heading" className="rounded-[var(--r-xl)] border border-line bg-bg-elevated px-6 py-12 md:px-14 md:py-20">
      <div className="mx-auto max-w-3xl text-center">
        <p className="eyebrow mb-4">Discover</p>
        <h2 id="discover-heading" className="headline text-3xl md:text-5xl">
          Say what you need, the way you&rsquo;d say it.
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-fg-muted">A budget, a mood, an occasion. FabricNest reads the intent, turns it into real filters you can see, and ranks the catalogue against it.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            go(q);
          }}
          className="mx-auto mt-8 flex max-w-xl items-center gap-2 rounded-full border border-line-strong bg-surface py-1.5 pl-5 pr-1.5 focus-within:border-fg/40"
        >
          <Sparkles className="h-4.5 w-4.5 shrink-0 text-accent" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="I need…" aria-label="Describe what you need" className="h-11 w-full min-w-0 bg-transparent text-[16px] text-fg placeholder:text-fg-faint focus:outline-none" />
          <button type="submit" aria-label="Discover" className="tactile flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-fg text-bg disabled:opacity-30" disabled={!q.trim()}>
            <ArrowUp className="h-4 w-4" />
          </button>
        </form>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {EXAMPLES.map((e) => (
            <button key={e} onClick={() => go(e)} className="tactile rounded-full px-3 py-1.5 text-[13px] text-fg-muted hover:bg-white/[0.05] hover:text-fg">
              &ldquo;{e}&rdquo;
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
