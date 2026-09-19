"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { api, messageOf } from "@/lib/client/api";
import { formatPrice } from "@/lib/client/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { toast } from "@/lib/store/ui";

/** Simulated card form. Makes the failure path as real as the success path. */
export function TestGateway({ checkoutId, total, itemCount }: { checkoutId: string; total: number; itemCount: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState<"paid" | "failed" | null>(null);
  const complete = async (outcome: "paid" | "failed") => {
    setBusy(outcome);
    try {
      const res = await api.post<{ paid: boolean }>("/api/checkout/test-complete", { checkoutId, outcome });
      router.replace(res.paid ? `/checkout/success?checkout=${checkoutId}` : `/checkout/cancelled?checkout=${checkoutId}&reason=failed`);
    } catch (err) {
      setBusy(null);
      toast({ title: "Payment couldn't be completed.", description: messageOf(err), tone: "danger" });
    }
  };
  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-[var(--r-xl)] border border-line p-6 md:p-8">
        <p className="eyebrow mb-3">Test gateway</p>
        <h1 className="headline text-2xl">Pay {formatPrice(total)}</h1>
        <p className="mt-1 text-[14px] text-fg-muted">{itemCount} {itemCount === 1 ? "item" : "items"}. No real charge is made; this page stands in for Stripe&rsquo;s hosted checkout.</p>
        <div className="mt-6 grid gap-4">
          <Input label="Card number" defaultValue="4242 4242 4242 4242" inputMode="numeric" readOnly />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Expiry" defaultValue="12 / 34" readOnly />
            <Input label="CVC" defaultValue="123" readOnly />
          </div>
        </div>
        <Button full size="lg" className="mt-6" onClick={() => complete("paid")} loading={busy === "paid"} disabled={busy !== null}>
          <Lock className="h-4 w-4" /> Pay {formatPrice(total)}
        </Button>
        <button onClick={() => complete("failed")} disabled={busy !== null} className="mt-3 w-full text-center text-[13px] text-fg-muted hover:text-fg disabled:opacity-40">
          Simulate a declined card
        </button>
      </div>
    </div>
  );
}
