import type { Metadata } from "next";
import { Suspense } from "react";
import { listQuerySchema } from "@/lib/validation/commerce";
import { listProducts } from "@/lib/commerce/product-query";
import { connectDB } from "@/lib/db";
import { Category } from "@/lib/models/Category";
import { toCategory } from "@/lib/commerce/serialize";
import { PageShell } from "@/components/layout/page-shell";
import { Footer } from "@/components/layout/footer";
import { ProductGrid } from "@/components/commerce/product-grid";
import { FilterBar } from "@/components/commerce/filter-sheet";
import { Pagination } from "@/components/commerce/pagination";
import { EmptyState } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/client/cn";

export const metadata: Metadata = { title: "Shop" };

type Search = Record<string, string | string[] | undefined>;

export default async function ShopPage({ searchParams }: { searchParams: Promise<Search> }) {
  const raw = await searchParams;
  const flat = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
  const parsed = listQuerySchema.safeParse(flat);
  const q = parsed.success ? parsed.data : listQuerySchema.parse({});
  await connectDB();
  const [{ products, pagination }, cats] = await Promise.all([listProducts(q), Category.find().sort({ order: 1 }).lean()]);
  const categories = cats.map((c) => toCategory(c));
  const activeCategory = q.category && !q.category.includes(",") ? categories.find((c) => c.slug === q.category) : null;


  return (
    <>
      <PageShell wide>
        <header className="mb-8 md:mb-10">
          <p className="eyebrow mb-3">{q.q ? "Search" : "Shop"}</p>
          <h1 className="display text-4xl md:text-6xl">{q.q ? `“${q.q}”` : activeCategory?.name ?? "Everything."}</h1>
          {activeCategory?.description && <p className="mt-3 max-w-lg text-[15px] text-fg-muted">{activeCategory.description}</p>}
        </header>

        <nav aria-label="Categories" className="scrollbar-hide -mx-5 mb-6 overflow-x-auto px-5 md:mx-0 md:px-0">
          <ul className="flex gap-2">
            <li>
              <Link href="/shop" className={cn("inline-flex h-9 items-center whitespace-nowrap rounded-full border px-4 text-[13px]", !q.category ? "border-fg bg-fg text-bg" : "border-line text-fg-soft hover:border-line-strong")}>
                All
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/shop?category=${c.slug}`} className={cn("inline-flex h-9 items-center whitespace-nowrap rounded-full border px-4 text-[13px]", q.category === c.slug ? "border-fg bg-fg text-bg" : "border-line text-fg-soft hover:border-line-strong")}>
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <Suspense>
          <FilterBar categories={categories} total={pagination.total} />
        </Suspense>

        <div className="mt-8">
          {products.length === 0 ? (
            <EmptyState title="We couldn't find an exact match." description="Try fewer filters, or describe what you're after and let Discover interpret it." action={<div className="flex gap-3"><Button href="/shop" variant="secondary">Clear filters</Button><Button href={`/discover${q.q ? `?q=${encodeURIComponent(q.q)}` : ""}`}>Try Discover</Button></div>} />
          ) : (
            <ProductGrid products={products} />
          )}
        </div>
        <Pagination pagination={pagination} basePath="/shop" params={flat} className="mt-14" />
      </PageShell>
      <Footer />
    </>
  );
}
