import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MOODS, BRAND } from "@/lib/constants";
import { getHomeData } from "@/lib/data/home";
import { Footer } from "@/components/layout/footer";
import { ProductRail } from "@/components/commerce/product-rail";
import { ProductImage } from "@/components/commerce/product-image";
import { Curated } from "@/components/intelligence/curated";
import { HomeHero } from "@/components/home/hero";
import { DiscoverTeaser } from "@/components/home/discover-teaser";
import { Container, SectionHeading } from "@/components/ui/primitives";

export const revalidate = 120;

export default async function HomePage() {
  const { featured, newArrivals, stories } = await getHomeData().catch(() => ({ featured: [], newArrivals: [], categories: [], stories: [] }));
  const hero = featured[0] ?? newArrivals[0] ?? null;

  return (
    <>
      <main>
        <HomeHero product={hero} tagline={BRAND.tagline} />

        <Container className="mt-20 md:mt-28">
          <Curated fallback={featured.length ? featured : newArrivals} />
        </Container>

        {/* Shop by mood */}
        <Container className="mt-24 md:mt-32">
          <SectionHeading eyebrow="Shop by mood" title="Start with how the day feels." description="Five moods, each a small edit. Every piece is tagged by the way it wears, not just what it is." />
          <ul className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-4">
            {MOODS.map((m, i) => {
              const cover = featured.find((p) => p.moods.includes(m.slug)) ?? newArrivals.find((p) => p.moods.includes(m.slug)) ?? featured[i];
              return (
                <li key={m.slug} className={i === 0 ? "col-span-2 md:col-span-1" : ""}>
                  <Link href={`/collections/${m.slug}`} className="group relative block aspect-[4/5] overflow-hidden rounded-[var(--r-lg)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
                    <ProductImage src={cover?.image?.url} alt="" sizes="(max-width: 768px) 50vw, 20vw" fallbackHex={cover?.colors[0]?.hex} className="absolute inset-0 transition-transform duration-[1400ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.04]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
                      <p className="font-display text-xl tracking-[-0.02em] text-white md:text-2xl">{m.name}</p>
                      <p className="mt-1 hidden text-[13px] text-white/70 md:block">{m.blurb}</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Container>

        {/* New arrivals */}
        <Container className="mt-24 md:mt-32">
          <SectionHeading eyebrow="New arrivals" title="Just in." action={{ label: "See everything new", href: "/shop?sort=newest" }} className="mb-10" />
          <ProductRail products={newArrivals} />
        </Container>

        {/* Discover */}
        <Container className="mt-24 md:mt-32">
          <DiscoverTeaser />
        </Container>

        {/* Editorial */}
        {stories.length > 0 && (
          <Container className="mt-24 md:mt-32">
            <SectionHeading eyebrow="Editorial" title="Three pieces, closely read." />
            <div className="mt-10 space-y-16 md:space-y-24">
              {stories.map((s, i) => (
                <article key={s.slug} className={`grid items-center gap-8 md:grid-cols-12 md:gap-12 ${i % 2 ? "md:[&>*:first-child]:order-2" : ""}`}>
                  <Link href={`/products/${s.product.slug}`} className="group relative block aspect-[4/5] overflow-hidden rounded-[var(--r-xl)] md:col-span-7 md:aspect-[5/4]">
                    <ProductImage src={s.product.image?.url} alt={s.product.name} sizes="(max-width: 768px) 100vw, 60vw" fallbackHex={s.product.colors[0]?.hex} className="absolute inset-0 transition-transform duration-[1400ms] ease-[var(--ease-out-expo)] group-hover:scale-[1.03]" />
                  </Link>
                  <div className="md:col-span-5 md:px-4">
                    <p className="eyebrow mb-4">{s.product.fabric} · {s.product.categorySlug.replace(/-/g, " ")}</p>
                    <h3 className="headline text-3xl md:text-[40px]">{s.title}</h3>
                    <p className="mt-4 max-w-md text-[15px] leading-relaxed text-fg-muted">{s.standfirst}</p>
                    <Link href={`/products/${s.product.slug}`} className="group mt-6 inline-flex items-center gap-2 text-sm text-fg">
                      <span className="link-underline">{s.product.name}</span>
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </Container>
        )}
      </main>
      <Footer />
    </>
  );
}
