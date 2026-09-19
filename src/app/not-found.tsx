import { PageShell } from "@/components/layout/page-shell";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <>
      <PageShell className="flex min-h-[70dvh] flex-col items-center justify-center text-center">
        <p className="eyebrow mb-4">404</p>
        <h1 className="display text-4xl md:text-6xl">This page has moved on.</h1>
        <p className="mt-4 max-w-md text-[15px] text-fg-muted">The link may be old, or the piece may have sold out for good.</p>
        <div className="mt-8 flex gap-3">
          <Button href="/shop">Back to the shop</Button>
          <Button href="/discover" variant="secondary">
            Discover instead
          </Button>
        </div>
      </PageShell>
      <Footer />
    </>
  );
}
