"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, X } from "lucide-react";
import { useCart } from "@/lib/store/cart";
import { useSession } from "@/lib/store/session";
import { toast } from "@/lib/store/ui";
import { messageOf } from "@/lib/client/api";
import { formatPrice } from "@/lib/client/format";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/constants";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { QuantityControl } from "@/components/ui/quantity";
import { EmptyState } from "@/components/ui/primitives";
import { ProductImage } from "@/components/commerce/product-image";
import { useIsDesktop } from "@/hooks/use-media";

export function CartDrawer() {
  const { cart, open, setOpen, update, remove, loaded } = useCart();
  const user = useSession((s) => s.user);
  const router = useRouter();
  const desktop = useIsDesktop();
  const toFree = Math.max(0, FREE_SHIPPING_THRESHOLD - cart.subtotal);

  const onQty = async (id: string, q: number) => {
    try {
      await update(id, q);
    } catch (err) {
      toast({ title: "Couldn't update quantity", description: messageOf(err, "Your bag is still safe. Try again."), tone: "danger" });
    }
  };
  const onRemove = async (id: string, name: string) => {
    try {
      await remove(id);
      toast({ title: "Removed from bag", description: name });
    } catch (err) {
      toast({ title: "Couldn't remove item", description: messageOf(err), tone: "danger" });
    }
  };

  return (
    <Sheet open={open} onClose={() => setOpen(false)} side={desktop ? "right" : "bottom"} title="Bag" description={cart.count ? `${cart.count} ${cart.count === 1 ? "item" : "items"}` : undefined} width="max-w-[440px]">
      {!user ? (
        <EmptyState icon={<ShoppingBag className="h-8 w-8" />} title="Sign in to see your bag" description="Your bag is saved to your account so it follows you across devices." action={<Button onClick={() => { setOpen(false); router.push("/login?next=/bag"); }}>Sign in</Button>} />
      ) : loaded && cart.items.length === 0 ? (
        <EmptyState icon={<ShoppingBag className="h-8 w-8" />} title="Your bag is empty." description="Everything you add will wait here." action={<Button variant="secondary" onClick={() => { setOpen(false); router.push("/shop"); }}>Start with the shop</Button>} />
      ) : (
        <div className="flex h-full flex-col">
          <ul className="flex-1 divide-y divide-line px-5 md:px-6">
            {cart.items.map((line) => (
              <li key={line.id} className="flex gap-4 py-4">
                <Link href={`/products/${line.product.slug}`} onClick={() => setOpen(false)} className="shrink-0">
                  <ProductImage src={line.product.image?.url} alt="" sizes="80px" fallbackHex={line.product.colors[0]?.hex} className="h-24 w-20 rounded-[var(--r-md)]" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/products/${line.product.slug}`} onClick={() => setOpen(false)} className="block truncate text-[14px] text-fg">
                        {line.product.name}
                      </Link>
                      <p className="meta mt-0.5">
                        {line.color} · {line.size}
                      </p>
                    </div>
                    <button onClick={() => onRemove(line.id, line.product.name)} aria-label={`Remove ${line.product.name}`} className="-mr-1 rounded-full p-1 text-fg-faint hover:text-fg">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <QuantityControl size="sm" value={line.quantity} onChange={(q) => onQty(line.id, q)} max={Math.min(10, Math.max(line.available, line.quantity))} />
                    <span className="tabular text-sm text-fg">{formatPrice(line.lineTotal)}</span>
                  </div>
                  {line.available < line.quantity && <p className="mt-2 text-[12px] text-warn">Only {line.available} left in this size.</p>}
                </div>
              </li>
            ))}
          </ul>
          <div className="glass glass-strong pb-safe sticky bottom-0 rounded-none border-x-0 border-b-0 px-5 py-4 md:px-6">
            <div className="flex items-center justify-between text-sm">
              <span className="text-fg-muted">Subtotal</span>
              <span className="tabular text-fg">{formatPrice(cart.subtotal)}</span>
            </div>
            <p className="meta mt-1">{toFree > 0 ? `Add ${formatPrice(toFree)} more for free standard delivery.` : "Free standard delivery included."}</p>
            <div className="mt-4 flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => { setOpen(false); router.push("/bag"); }}>
                View bag
              </Button>
              <Button className="flex-1" onClick={() => { setOpen(false); router.push("/checkout"); }}>
                Checkout
              </Button>
            </div>
          </div>
        </div>
      )}
    </Sheet>
  );
}
