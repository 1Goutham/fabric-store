"use client";
import Link from "next/link";
import { ShoppingBag, X } from "lucide-react";
import { useCart } from "@/lib/store/cart";
import { useSession } from "@/lib/store/session";
import { toast } from "@/lib/store/ui";
import { messageOf } from "@/lib/client/api";
import { formatPrice } from "@/lib/client/format";
import { computePricing } from "@/lib/commerce/pricing";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import { ProductImage } from "@/components/commerce/product-image";
import { QuantityControl } from "@/components/ui/quantity";
import { Button } from "@/components/ui/button";
import { EmptyState, Skeleton } from "@/components/ui/primitives";

export function BagView() {
  const { cart, loaded, update, remove } = useCart();
  const user = useSession((s) => s.user);
  const hydrated = useSession((s) => s.hydrated);
  const pricing = computePricing(cart.subtotal, "standard");

  if (hydrated && !user) {
    return <EmptyState icon={<ShoppingBag className="h-8 w-8" />} title="Sign in to see your bag" description="Your bag is saved to your account so it follows you across devices." action={<Button href="/login?next=/bag">Sign in</Button>} />;
  }
  if (!loaded) {
    return (
      <div>
        <Skeleton className="mb-10 h-9 w-40" />
        <div className="space-y-6">
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-5">
              <Skeleton className="h-36 w-28" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (cart.items.length === 0) {
    return <EmptyState icon={<ShoppingBag className="h-8 w-8" />} title="Your bag is empty." description="Everything you add will wait here." action={<div className="flex gap-3"><Button href="/shop">Shop</Button><Button href="/saved" variant="secondary">See saved</Button></div>} />;
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_360px] lg:gap-16">
      <div>
        <header className="mb-8">
          <p className="eyebrow mb-3">Bag</p>
          <h1 className="display text-4xl md:text-5xl">
            {cart.count} {cart.count === 1 ? "item" : "items"}
          </h1>
        </header>
        <ul className="divide-y divide-line border-y border-line">
          {cart.items.map((l) => (
            <li key={l.id} className="flex gap-5 py-6">
              <Link href={`/products/${l.product.slug}`} className="shrink-0">
                <ProductImage src={l.product.image?.url} alt="" sizes="120px" fallbackHex={l.product.colors[0]?.hex} className="h-36 w-28 rounded-[var(--r-md)] md:h-40 md:w-32" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <Link href={`/products/${l.product.slug}`} className="block text-[15px] text-fg">{l.product.name}</Link>
                    <p className="meta mt-1">{l.color} · {l.size} · {l.product.fabric}</p>
                    <p className="tabular mt-1 text-[13px] text-fg-muted">{formatPrice(l.unitPrice)} each</p>
                  </div>
                  <button onClick={() => remove(l.id).then(() => toast({ title: "Removed from bag", description: l.product.name })).catch((e) => toast({ title: "Couldn't remove", description: messageOf(e), tone: "danger" }))} aria-label={`Remove ${l.product.name}`} className="rounded-full p-1 text-fg-faint hover:text-fg">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between pt-4">
                  <QuantityControl value={l.quantity} onChange={(q) => update(l.id, q).catch((e) => toast({ title: "Couldn't update", description: messageOf(e, "Your bag is still safe. Try again."), tone: "danger" }))} max={Math.min(10, Math.max(l.available, l.quantity))} />
                  <span className="tabular text-[15px] text-fg">{formatPrice(l.lineTotal)}</span>
                </div>
                {l.available < l.quantity && <p className="mt-2 text-[12px] text-warn">Only {l.available} left in this size. Adjust before checkout.</p>}
              </div>
            </li>
          ))}
        </ul>
      </div>
      <aside className="lg:sticky lg:top-[calc(var(--nav-h)+40px)] lg:self-start">
        <div className="rounded-[var(--r-xl)] border border-line p-6">
          <h2 className="headline text-lg">Summary</h2>
          <dl className="mt-5 space-y-3 text-[14px]">
            <div className="flex justify-between"><dt className="text-fg-muted">Subtotal</dt><dd className="tabular">{formatPrice(pricing.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-fg-muted">Standard delivery</dt><dd className="tabular">{pricing.shipping === 0 ? "Free" : formatPrice(pricing.shipping)}</dd></div>
            <div className="flex justify-between"><dt className="text-fg-muted">GST (5%)</dt><dd className="tabular">{formatPrice(pricing.tax)}</dd></div>
            <div className="flex justify-between border-t border-line pt-3 text-[15px]"><dt>Total</dt><dd className="tabular text-fg">{formatPrice(pricing.total)}</dd></div>
          </dl>
          {cart.subtotal < FREE_SHIPPING_THRESHOLD && <p className="meta mt-3">Add {formatPrice(FREE_SHIPPING_THRESHOLD - cart.subtotal)} more for free standard delivery.</p>}
          <Button href="/checkout" full size="lg" className="mt-6" disabled={cart.items.some((l) => l.available < l.quantity)}>
            Checkout
          </Button>
          <p className="meta mt-3 text-center">Payment is verified server-side before any order is created.</p>
        </div>
      </aside>
    </div>
  );
}
