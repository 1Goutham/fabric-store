"use client";
import { useEffect } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <PageShell className="flex min-h-[70dvh] flex-col items-center justify-center text-center">
      <h1 className="display text-4xl md:text-5xl">Something went wrong.</h1>
      <p className="mt-4 max-w-md text-[15px] text-fg-muted">Your bag is still safe. Try again, and if it keeps happening we&rsquo;d like to know.</p>
      <div className="mt-8 flex gap-3">
        <Button onClick={reset}>Retry</Button>
        <Button href="/" variant="secondary">
          Go home
        </Button>
      </div>
      {error.digest && <p className="meta mt-6 font-mono">Ref {error.digest}</p>}
    </PageShell>
  );
}
