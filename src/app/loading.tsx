import { PageShell } from "@/components/layout/page-shell";
import { ProductGridSkeleton } from "@/components/commerce/product-grid";

export default function Loading() {
  return (
    <PageShell>
      <div className="skeleton mb-3 h-3 w-24" />
      <div className="skeleton mb-10 h-9 w-72" />
      <ProductGridSkeleton />
    </PageShell>
  );
}
