import type { Metadata } from "next";
import Link from "next/link";
import { MOODS } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { Category } from "@/lib/models/Category";
import { toProductCard, toCategory } from "@/lib/commerce/serialize";
import { PageShell } from "@/components/layout/page-shell";
import { Footer } from "@/components/layout/footer";
import { ProductImage } from "@/components/commerce/product-image";
import { SectionHeading } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "Collections" };
export const revalidate = 300;

export default async function CollectionsPage() {
  await connectDB();
  const [cats, products] = await Promise.all([Category.find().sort({ order: 1 }).lean(), Product.find({ status: "active" }).sort({ featured: -1, salesCount: -1 }).limit(60).lean()]);
  const cards = products.map((p) => toProductCard(p));
  const categories = cats.map((c) => toCategory(c));
  const coverFor = (slug: string) => cards.find((p) => p.moods.includes(slug as never));
  return (
    <>
      <PageShell wide>
        <header className="mb-10 max-w-2xl">
          <p className="eyebrow mb-3">Collections</p>
          <h1 className="display text-4xl md:text-6xl">Edits, by mood and by kind.</h1>
        </header>

        <section aria-labelledby="moods">
          <SectionHeading title="By mood" as="h2" className="mb-8" />
          <ul className="grid gap-4 md:grid-cols-6">
            {MOODS.map((m, i) => {
              const cover = coverFor(m.slug);
              return (
                <li key={m.slug} className={i < 2 ? "md:col-span-3" : "md:col-span-2"}>
                  <Link href={`/collections/${m.slug}`} className="group relative block aspect-[4/3] overflow-hidden rounded-[var(--r-xl)]">
                    <ProductImage src={cover?.image?.url} alt="" sizes="(max-width: 768px) 100vw, 50vw" fallbackHex={cover?.colors[0]?.hex} className="absolute inset-0 transition-transform duration-[1400ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.04]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-6">
                      <p className="font-display text-2xl tracking-[-0.02em] text-white md:text-3xl">{m.name}</p>
                      <p className="mt-1 text-[14px] text-white/70">{m.blurb}</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="kinds" className="mt-20">
          <SectionHeading title="By kind" as="h2" className="mb-8" />
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {categories.map((c) => {
              const cover = cards.find((p) => p.categorySlug === c.slug);
              return (
                <li key={c.slug}>
                  <Link href={`/shop?category=${c.slug}`} className="group block">
                    <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--r-lg)]">
                      <ProductImage src={c.image ?? cover?.image?.url} alt="" sizes="(max-width: 768px) 50vw, 25vw" fallbackHex={cover?.colors[0]?.hex} className="absolute inset-0 transition-transform duration-[1400ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.04]" />
                    </div>
                    <p className="mt-3 text-[15px] text-fg">{c.name}</p>
                    <p className="meta line-clamp-1">{c.description}</p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </PageShell>
      <Footer />
    </>
  );
}
