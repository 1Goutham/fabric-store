"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/client/cn";
import type { ProductDetail } from "@/types";
import { useCart } from "@/lib/store/cart";
import { useSession } from "@/lib/store/session";
import { toast } from "@/lib/store/ui";
import { messageOf } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import { QuantityControl } from "@/components/ui/quantity";
import { SaveButton } from "./save-button";

/**
 * Variant picker + add to bag. Stock is per colour/size; sold-out cells are
 * shown, not hidden, so the customer understands what exists.
 */
export function AddToBag({ product }: { product: ProductDetail }) {
  const router = useRouter();
  const user = useSession((s) => s.user);
  const add = useCart((s) => s.add);
  const [color, setColor] = useState(product.colors[0]?.name ?? "");
  const [size, setSize] = useState<string>("");
  const [qty, setQty] = useState(1);
  const [state, setState] = useState<"idle" | "adding" | "added">("idle");
  const [error, setError] = useState<string | null>(null);

  const stockFor = (c: string, s: string) => {
    if (product.variants.length === 0) return product.stock;
    return product.variants.find((v) => v.color === c && v.size === s)?.stock ?? 0;
  };
  const colorStock = (c: string) => (product.variants.length ? product.variants.filter((v) => v.color === c).reduce((n, v) => n + v.stock, 0) : product.stock);
  const available = size ? stockFor(color, size) : null;
  const canAdd = Boolean(color && size && available && available > 0);
  const onlyFew = available !== null && available > 0 && available <= 3;

  const availabilityLabel = useMemo(() => {
    if (!size) return product.stock > 0 ? "In stock" : "Sold out";
    if (available === 0) return "Sold out in this size";
    if (onlyFew) return `Only ${available} left`;
    return "In stock";
  }, [size, available, onlyFew, product.stock]);

  const onAdd = async () => {
    if (!size) {
      setError("Choose a size first.");
      return;
    }
    if (!user) {
      toast({ title: "Sign in to add to your bag", description: "Your bag is saved to your account.", action: { label: "Sign in", onClick: () => router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`) } });
      return;
    }
    setError(null);
    setState("adding");
    try {
      await add(product, color, size, qty);
      setState("added");
      setTimeout(() => setState("idle"), 1600);
    } catch (err) {
      setState("idle");
      toast({ title: "Couldn't add to bag", description: messageOf(err, "Your bag is still safe. Try again."), tone: "danger" });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {product.colors.length > 0 && (
        <fieldset>
          <div className="mb-2.5 flex items-baseline justify-between">
            <legend className="text-[12px] tracking-wide text-fg-muted">Colour</legend>
            <span className="text-[13px] text-fg-soft">{color}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {product.colors.map((c) => {
              const out = colorStock(c.name) === 0;
              return (
                <button
                  key={c.name}
                  type="button"
                  aria-label={`${c.name}${out ? ", sold out" : ""}`}
                  aria-pressed={color === c.name}
                  onClick={() => {
                    setColor(c.name);
                    setError(null);
                  }}
                  className={cn("tactile relative flex h-9 w-9 items-center justify-center rounded-full border transition-colors", color === c.name ? "border-fg" : "border-line hover:border-line-strong")}
                >
                  <span className="h-6 w-6 rounded-full border border-white/10" style={{ backgroundColor: c.hex }} />
                  {out && <span aria-hidden className="absolute h-px w-8 rotate-45 bg-fg/60" />}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {product.sizes.length > 0 && (
        <fieldset>
          <div className="mb-2.5 flex items-baseline justify-between">
            <legend className="text-[12px] tracking-wide text-fg-muted">Size</legend>
            <span className={cn("text-[13px]", available === 0 ? "text-danger" : onlyFew ? "text-warn" : "text-fg-soft")}>{availabilityLabel}</span>
          </div>
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
            {product.sizes.map((s) => {
              const n = stockFor(color, s);
              const out = n === 0;
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={size === s}
                  aria-label={`Size ${s}${out ? ", sold out" : ""}`}
                  onClick={() => {
                    setSize(s);
                    setError(null);
                  }}
                  className={cn("tactile relative h-11 rounded-[var(--r-md)] border text-sm transition-colors", size === s ? "border-fg bg-fg text-bg" : out ? "border-line text-fg-faint" : "border-line text-fg hover:border-line-strong")}
                >
                  {s}
                  {out && <span aria-hidden className="absolute left-1/2 top-1/2 h-px w-7 -translate-x-1/2 -translate-y-1/2 rotate-[-20deg] bg-current opacity-50" />}
                </button>
              );
            })}
          </div>
          {error && (
            <p role="alert" className="mt-2 text-[13px] text-danger">
              {error}
            </p>
          )}
        </fieldset>
      )}

      <div className="flex items-center gap-3">
        <QuantityControl value={qty} onChange={setQty} max={Math.max(1, Math.min(10, available ?? 10))} />
        <Button onClick={onAdd} size="lg" className="flex-1" disabled={size !== "" && !canAdd} loading={state === "adding"}>
          {state === "added" ? (
            <>
              <Check className="h-4 w-4" /> Added to bag
            </>
          ) : (
            <>
              <ShoppingBag className="h-4 w-4" /> {size && available === 0 ? "Sold out" : "Add to bag"}
            </>
          )}
        </Button>
        <SaveButton product={product} size="lg" />
      </div>
    </div>
  );
}
