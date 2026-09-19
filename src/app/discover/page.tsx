import type { Metadata } from "next";
import { Suspense } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Footer } from "@/components/layout/footer";
import { Discover } from "@/components/intelligence/discover";
import { understandQuery } from "@/lib/intelligence/understand";
import { discover } from "@/lib/intelligence/discover";
import { getCurrentUser } from "@/lib/auth/session";
import { getStyleProfile } from "@/lib/intelligence/preferences";
import type { DiscoverResult } from "@/types";

export const metadata: Metadata = { title: "Discover", description: "Describe what you need. FabricNest turns intent into products." };

export default async function DiscoverPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  let initial: DiscoverResult | null = null;
  if (q.trim()) {
    try {
      const user = await getCurrentUser();
      const [intent, profile] = await Promise.all([understandQuery(q.trim().slice(0, 300)), getStyleProfile(user?.id ?? null)]);
      initial = await discover(intent, { limit: 24, profile });
    } catch {
      initial = null;
    }
  }
  return (
    <>
      <PageShell>
        <header className="mb-8 max-w-2xl md:mb-10">
          <p className="eyebrow mb-3">Discover</p>
          <h1 className="display text-4xl md:text-6xl">What are you looking for?</h1>
        </header>
        <Suspense>
          <Discover initialQuery={q} initialResult={initial} />
        </Suspense>
      </PageShell>
      <Footer />
    </>
  );
}
