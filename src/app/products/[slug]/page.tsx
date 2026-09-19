import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/commerce/product-query";
import { toProductDetail } from "@/lib/commerce/serialize";
import { pairsWellWith, similarProducts } from "@/lib/intelligence/recommend";
import { PageShell } from "@/components/layout/page-shell";
import { Footer } from "@/components/layout/footer";
import { ProductGallery } from "@/components/commerce/product-gallery";
import { AddToBag } from "@/components/commerce/add-to-bag";
import { ProductRail } from "@/components/commerce/product-rail";
import { Reviews } from "@/components/commerce/reviews";
import { ViewSignal } from "@/components/commerce/view-signal";
import { AskAboutThis } from "@/components/commerce/ask-about-this";
import { Price, Rating, SectionHeading } from "@/components/ui/primitives";
import { DELIVERY_METHODS, FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import { formatPrice } from "@/lib/commerce/pricing";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug).catch(() => null);
  if (!p) return { title: "Product" };
  return { title: p.name, description: p.description, openGraph: { title: p.name, description: p.description, images: p.images?.[0]?.url ? [p.images[0].url] : [] } };
}

/** Why you might like this: real attributes, phrased as reasons. Nothing invented. */
function reasonsFor(p: ReturnType<typeof toProductDetail>) {
  const out: { label: string; detail: string }[] = [];
  if (p.material) out.push({ label: p.fabric, detail: p.material });
  const fitCopy: Record<string, string> = { relaxed: "Cut with room through the body and shoulder.", regular: "A classic, even cut. True to size.", slim: "Closer through the body without pinching.", oversized: "Deliberately wide; size down for a regular fit." };
  out.push({ label: `${p.fit.charAt(0).toUpperCase() + p.fit.slice(1)} fit`, detail: fitCopy[p.fit] ?? "" });
  if (p.moods.length) out.push({ label: "Mood", detail: p.moods.map((m) => m.charAt(0).toUpperCase() + m.slice(1)).join(" · ") });
  if (p.seasons.length) out.push({ label: "Season", detail: p.seasons.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" · ") });
  if (p.occasions.length) out.push({ label: "Wear it to", detail: p.occasions.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(", ") });
  if (p.rating.count >= 3 && p.rating.average >= 4.3) out.push({ label: "Rated well", detail: `${p.rating.average.toFixed(1)} from ${p.rating.count} customers.` });
  return out.slice(0, 5);
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = await getProductBySlug(slug).catch(() => null);
  if (!doc) notFound();
  const product = toProductDetail(doc, doc.category);
  const [similar, pairs] = await Promise.all([similarProducts(doc, 8), pairsWellWith(doc, 6)]);
  const reasons = reasonsFor(product);

  return (
    <>
      <ViewSignal productId={product.id} />
      <PageShell wide className="md:pt-[calc(var(--nav-h)+24px)]">
        <nav aria-label="Breadcrumb" className="mb-5 text-[12px] text-fg-muted">
          <ol className="flex items-center gap-2">
            <li>
              <Link href="/shop" className="hover:text-fg">Shop</Link>
            </li>
            <li aria-hidden>/</li>
            {product.category && (
              <>
                <li>
                  <Link href={`/shop?category=${product.category.slug}`} className="hover:text-fg">{product.category.name}</Link>
                </li>
                <li aria-hidden>/</li>
              </>
            )}
            <li aria-current="page" className="text-fg-soft">{product.name}</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-12 lg:gap-16">
          <div className="min-w-0 md:col-span-7 lg:col-span-7">
            <ProductGallery images={product.images} name={product.name} fallbackHex={product.colors[0]?.hex} />
          </div>
          <div className="min-w-0 md:col-span-5 lg:col-span-5 md:sticky md:top-[calc(var(--nav-h)+24px)] md:self-start">
            <p className="eyebrow mb-3">{product.fabric} · {product.category?.name ?? product.categorySlug}</p>
            <h1 className="headline text-3xl md:text-[38px]">{product.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <Price amount={product.price} compareAt={product.compareAtPrice} size="lg" />
              {product.rating.count > 0 ? <a href="#reviews" className="hover:opacity-80"><Rating value={product.rating.average} count={product.rating.count} /></a> : <span className="meta">No reviews yet</span>}
            </div>
            <p className="mt-5 text-[15px] leading-relaxed text-fg-soft">{product.description}</p>
            <div className="mt-8">
              <AddToBag product={product} />
            </div>
            <div className="mt-6 flex flex-col gap-2 text-[13px] text-fg-muted">
              <p>Standard delivery {product.price >= FREE_SHIPPING_THRESHOLD ? "free" : `${formatPrice(0)} over ${formatPrice(FREE_SHIPPING_THRESHOLD)}`} · {DELIVERY_METHODS.standard.eta}. Express {formatPrice(DELIVERY_METHODS.express.price)} · {DELIVERY_METHODS.express.eta}.</p>
              <p>Free returns within 14 days. Prices include GST.</p>
            </div>
            <div className="mt-6">
              <AskAboutThis productId={product.id} />
            </div>

            <dl className="mt-10 divide-y divide-line border-y border-line">
              <Row label="Details">
                <p>{product.story ?? product.description}</p>
              </Row>
              <Row label="Material">
                <p>{product.material ?? product.fabric}</p>
              </Row>
              <Row label="Fit">
                <p className="capitalize">{product.fit} fit. {product.gender !== "unisex" ? `Cut for ${product.gender}.` : "Unisex sizing."}</p>
              </Row>
              <Row label="Care">
                <ul className="space-y-1">
                  {product.care.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </Row>
              <Row label="Delivery">
                <p>Dispatched within 24 hours from Chennai. Tracking by email.</p>
              </Row>
            </dl>
          </div>
        </div>

        {/* Why you might like this */}
        <section className="mt-20 md:mt-28" aria-labelledby="why">
          <SectionHeading eyebrow="Why you might like this" title="Read the label, not the hype." as="h2" />
          <ul className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-5">
            {reasons.map((r) => (
              <li key={r.label} className="border-t border-line pt-4">
                <p className="text-[13px] text-fg">{r.label}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-fg-muted">{r.detail}</p>
              </li>
            ))}
          </ul>
        </section>

        {pairs.length > 0 && (
          <section className="mt-20 md:mt-28" aria-labelledby="pairs">
            <SectionHeading eyebrow="Pairs well with" title="Finish the look." as="h2" className="mb-10" />
            <ProductRail products={pairs.map((p) => p.product)} reasons={Object.fromEntries(pairs.map((p) => [p.product.id, p.reason]))} />
          </section>
        )}

        {similar.length > 0 && (
          <section className="mt-20 md:mt-28" aria-labelledby="similar">
            <SectionHeading eyebrow="Similar products" title="Close in cut and feel." as="h2" className="mb-10" />
            <ProductRail products={similar.map((p) => p.product)} reasons={Object.fromEntries(similar.map((p) => [p.product.id, p.reason]))} />
          </section>
        )}

        <div className="mt-20 md:mt-28">
          <Reviews productId={product.id} initialAverage={product.rating.average} initialCount={product.rating.count} />
        </div>
      </PageShell>
      <Footer />
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-4 py-4 text-[14px]">
      <dt className="text-fg-muted">{label}</dt>
      <dd className="leading-relaxed text-fg-soft">{children}</dd>
    </div>
  );
}
