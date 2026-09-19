import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MOODS } from "@/lib/constants";
import { emptyIntent } from "@/lib/intelligence/intent";
import { discover } from "@/lib/intelligence/discover";
import { getCurrentUser } from "@/lib/auth/session";
import { getStyleProfile } from "@/lib/intelligence/preferences";
import { PageShell } from "@/components/layout/page-shell";
import { Footer } from "@/components/layout/footer";
import { ProductGrid } from "@/components/commerce/product-grid";
import { EmptyState } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const mood = MOODS.find((m) => m.slug === slug);
  return { title: mood ? `${mood.name} edit` : "Collection" };
}

export default async function MoodPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const mood = MOODS.find((m) => m.slug === slug);
  if (!mood) notFound();
  const user = await getCurrentUser();
  const profile = await getStyleProfile(user?.id ?? null);
  const intent = { ...emptyIntent(mood.name), moods: [mood.slug] };
  const result = await discover(intent, { limit: 36, profile });
  return (
    <>
      <PageShell wide>
        <header className="mb-10 max-w-2xl">
          <p className="eyebrow mb-3">Mood</p>
          <h1 className="display text-4xl md:text-6xl">{mood.name}.</h1>
          <p className="mt-3 text-[15px] text-fg-muted">{mood.blurb}</p>
        </header>
        {result.products.length === 0 ? (
          <EmptyState title="Nothing in this mood right now." description="New pieces land every week." action={<Button href="/shop" variant="secondary">Browse everything</Button>} />
        ) : (
          <ProductGrid products={result.products} />
        )}
      </PageShell>
      <Footer />
    </>
  );
}
