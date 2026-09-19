import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { Footer } from "@/components/layout/footer";
import { Signature } from "@/components/layout/signature";
import { BRAND } from "@/lib/constants";

export const metadata: Metadata = { title: "About" };

const STACK = [
  ["Frontend", "Next.js App Router, React Server Components, TypeScript, Tailwind v4, Framer Motion"],
  ["Backend", "Next.js Route Handlers, Zod validation, JWT sessions in httpOnly cookies, role checks re-read from the database"],
  ["Data", "MongoDB with Mongoose: users, products, categories, carts, wishlists, orders, reviews, preferences"],
  ["Payments", "Stripe Checkout Sessions; orders are created only after a verified webhook or server-side session check"],
  ["Intelligence", "A rules-based intent parser and ranking pipeline, optionally upgraded by Gemini structured output. Compact prompts, cached, server-side"],
  ["Deployment", "Vercel, environment-driven configuration, no secrets in the client bundle"],
];

export default function AboutPage() {
  return (
    <>
      <PageShell>
        <div className="max-w-3xl">
          <p className="eyebrow mb-3">About</p>
          <h1 className="display text-4xl md:text-6xl">Clothing, chosen the way you actually think.</h1>
          <p className="mt-6 text-[17px] leading-relaxed text-fg-soft">
            FabricNest is a small edit of well-made pieces and a different way of finding them. Instead of filters first, it starts with the day you have: a budget, a mood, an occasion. The system reads that intent, shows you how it understood it, and ranks the catalogue against it. As you browse, save and buy, it learns quietly and gets more useful.
          </p>
          <p className="mt-4 text-[17px] leading-relaxed text-fg-soft">The intelligence is deliberately honest. Query understanding is rules-based with an optional model upgrade; recommendations are transparent scores over real product attributes. Nothing is invented, and every reason shown is a feature that actually fired.</p>
        </div>

        <section id="delivery" className="mt-20 max-w-3xl scroll-mt-24">
          <h2 className="headline text-2xl">Delivery &amp; returns</h2>
          <dl className="mt-6 grid gap-6 text-[15px] sm:grid-cols-2">
            <div><dt className="text-fg">Standard</dt><dd className="mt-1 text-fg-muted">4–6 days. Free over ₹1,999, otherwise ₹0 at the moment.</dd></div>
            <div><dt className="text-fg">Express</dt><dd className="mt-1 text-fg-muted">1–2 days. ₹249.</dd></div>
            <div><dt className="text-fg">Returns</dt><dd className="mt-1 text-fg-muted">14 days, free, unworn with tags.</dd></div>
            <div><dt className="text-fg">Prices</dt><dd className="mt-1 text-fg-muted">In INR, inclusive of 5% GST shown at checkout.</dd></div>
          </dl>
        </section>

        <section className="mt-20 max-w-3xl">
          <h2 className="headline text-2xl">How it&rsquo;s built</h2>
          <dl className="mt-6 divide-y divide-line border-y border-line">
            {STACK.map(([k, v]) => (
              <div key={k} className="grid gap-2 py-4 sm:grid-cols-[140px_1fr]">
                <dt className="text-[14px] text-fg">{k}</dt>
                <dd className="text-[14px] leading-relaxed text-fg-muted">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-20 max-w-3xl rounded-[var(--r-xl)] border border-line p-8">
          <p className="eyebrow mb-3">Signature</p>
          <p className="headline text-2xl">{BRAND.signature}.</p>
          <p className="mt-3 text-[15px] leading-relaxed text-fg-muted">Designed and engineered end to end as a portfolio product: product design, full-stack engineering and applied AI, working together.</p>
          <Signature className="mt-5" muted={false} />
        </section>
      </PageShell>
      <Footer />
    </>
  );
}
