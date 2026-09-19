"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client/api";
import type { ProductCard } from "@/types";
import { useSession } from "@/lib/store/session";
import { ProductRail } from "@/components/commerce/product-rail";
import { ProductCardSkeleton } from "@/components/commerce/product-card";

interface Recs {
  items: { product: ProductCard; reason: string }[];
  personalised: boolean;
  style: string[];
  recentlyViewed: ProductCard[];
}

/**
 * "Curated for you": personalised when there are signals, otherwise honest
 * editor's picks. Loads client-side so the page shell stays cacheable.
 */
export function Curated({ fallback }: { fallback: ProductCard[] }) {
  const user = useSession((s) => s.user);
  const hydrated = useSession((s) => s.hydrated);
  const [recs, setRecs] = useState<Recs | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      setRecs(null);
      return;
    }
    setLoading(true);
    api
      .get<Recs>("/api/recommendations?limit=8")
      .then(setRecs)
      .catch(() => setRecs(null))
      .finally(() => setLoading(false));
  }, [user?.id, hydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  const personalised = Boolean(recs?.personalised && recs.items.length);
  const products = personalised ? recs!.items.map((i) => i.product) : fallback;
  const reasons = personalised ? Object.fromEntries(recs!.items.map((i) => [i.product.id, i.reason])) : undefined;

  return (
    <section aria-labelledby="curated-heading">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow mb-3">{personalised ? "Curated for you" : "Curated"}</p>
          <h2 id="curated-heading" className="headline text-[26px] md:text-[34px]">
            {personalised ? `Leaning ${recs!.style.slice(0, 2).join(" and ").toLowerCase() || "your way"}.` : "Editor's picks this week."}
          </h2>
          <p className="mt-2 max-w-md text-[15px] text-fg-muted">
            {personalised ? "Built from what you've looked at, saved and bought. It sharpens as you go." : user ? "Browse a little and this becomes yours." : "Sign in and this section learns what you like, quietly."}
          </p>
        </div>
        <Link href={user ? "/account#style" : "/login?next=/"} className="link-underline self-start text-sm text-fg-soft hover:text-fg md:self-auto">
          {user ? "Tune your style" : "Sign in"}
        </Link>
      </div>
      {loading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <ProductRail products={products} reasons={reasons} />
      )}
    </section>
  );
}
