"use client";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/client/cn";
import type { Address, CartSummary, SessionUser } from "@/types";
import { DELIVERY_METHODS, type DeliveryMethod } from "@/lib/constants";
import { computePricing } from "@/lib/commerce/pricing";
import { formatPrice } from "@/lib/client/format";
import { api, ApiClientError, messageOf } from "@/lib/client/api";
import { toast } from "@/lib/store/ui";
import { Button } from "@/components/ui/button";
import { Input, Checkbox } from "@/components/ui/field";
import { ProductImage } from "@/components/commerce/product-image";

const EMPTY: Address = { fullName: "", line1: "", line2: "", city: "", state: "", postalCode: "", country: "India", phone: "" };

/**
 * Four focused steps in one client flow: address → delivery → payment → review.
 * Prices shown here are recomputed on the server when the session is created.
 */
export function CheckoutFlow({ user, cart, mode }: { user: SessionUser; cart: CartSummary; mode: "stripe" | "test" }) {
  const defaultAddr = user.addresses.find((a) => a.isDefault) ?? user.addresses[0];
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [address, setAddress] = useState<Address>(defaultAddr ? { ...defaultAddr, line2: defaultAddr.line2 ?? "" } : { ...EMPTY, fullName: user.name });
  const [useSaved, setUseSaved] = useState<string | "new">(defaultAddr?.id ?? "new");
  const [save, setSave] = useState(!defaultAddr);
  const [delivery, setDelivery] = useState<DeliveryMethod>("standard");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const pricing = computePricing(cart.subtotal, delivery);

  const validateAddress = () => {
    const e: Record<string, string> = {};
    if (address.fullName.trim().length < 2) e.fullName = "Full name is required.";
    if (address.line1.trim().length < 3) e.line1 = "Address is required.";
    if (address.city.trim().length < 2) e.city = "City is required.";
    if (address.state.trim().length < 2) e.state = "State is required.";
    if (address.postalCode.trim().length < 4) e.postalCode = "Postal code is required.";
    if (address.phone.trim().length < 8) e.phone = "Phone number is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const pay = async () => {
    setBusy(true);
    try {
      const { url } = await api.post<{ url: string }>("/api/checkout/session", { address: { ...address, line2: address.line2 || "" }, deliveryMethod: delivery, saveAddress: useSaved === "new" && save });
      window.location.assign(url);
    } catch (err) {
      setBusy(false);
      if (err instanceof ApiClientError && err.fields) {
        setErrors(Object.fromEntries(Object.entries(err.fields).map(([k, v]) => [k.replace(/^address\./, ""), v])));
        setStep(1);
      }
      toast({ title: "Couldn't start payment", description: messageOf(err, "Your bag is still safe. Try again."), tone: "danger" });
    }
  };

  return (
    <div className="grid gap-12 lg:grid-cols-[1fr_380px] lg:gap-16">
      <div>
        {step === 1 && (
          <section aria-labelledby="s1">
            <h1 id="s1" className="headline text-3xl">Where should it go?</h1>
            {user.addresses.length > 0 && (
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {user.addresses.map((a) => (
                  <button key={a.id} type="button" onClick={() => { setUseSaved(a.id!); setAddress({ ...a, line2: a.line2 ?? "" }); }} className={cn("rounded-[var(--r-lg)] border p-4 text-left text-[14px] transition-colors", useSaved === a.id ? "border-fg" : "border-line hover:border-line-strong")}>
                    <p className="text-fg">{a.label ?? "Address"} · {a.fullName}</p>
                    <p className="mt-1 text-fg-muted">{a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.city} {a.postalCode}</p>
                  </button>
                ))}
                <button type="button" onClick={() => { setUseSaved("new"); setAddress({ ...EMPTY, fullName: user.name }); }} className={cn("rounded-[var(--r-lg)] border p-4 text-left text-[14px]", useSaved === "new" ? "border-fg" : "border-line hover:border-line-strong")}>
                  <p className="text-fg">New address</p>
                  <p className="mt-1 text-fg-muted">Enter a different delivery address.</p>
                </button>
              </div>
            )}
            {(useSaved === "new" || user.addresses.length === 0) && (
              <form className="mt-8 grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); if (validateAddress()) setStep(2); }}>
                <Input label="Full name" value={address.fullName} onChange={(e) => setAddress({ ...address, fullName: e.target.value })} error={errors.fullName} autoComplete="name" wrapperClassName="sm:col-span-2" />
                <Input label="Address" value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} error={errors.line1} autoComplete="address-line1" wrapperClassName="sm:col-span-2" />
                <Input label="Apartment, floor (optional)" value={address.line2 ?? ""} onChange={(e) => setAddress({ ...address, line2: e.target.value })} autoComplete="address-line2" wrapperClassName="sm:col-span-2" />
                <Input label="City" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} error={errors.city} autoComplete="address-level2" />
                <Input label="State" value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} error={errors.state} autoComplete="address-level1" />
                <Input label="PIN code" value={address.postalCode} onChange={(e) => setAddress({ ...address, postalCode: e.target.value })} error={errors.postalCode} autoComplete="postal-code" inputMode="numeric" />
                <Input label="Phone" value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} error={errors.phone} autoComplete="tel" inputMode="tel" />
                <Checkbox label="Save this address to my account" checked={save} onChange={(e) => setSave(e.target.checked)} className="sm:col-span-2" />
                <div className="sm:col-span-2">
                  <Button type="submit" size="lg">Continue to delivery <ArrowRight className="h-4 w-4" /></Button>
                </div>
              </form>
            )}
            {useSaved !== "new" && user.addresses.length > 0 && (
              <div className="mt-8">
                <Button size="lg" onClick={() => setStep(2)}>Continue to delivery <ArrowRight className="h-4 w-4" /></Button>
              </div>
            )}
          </section>
        )}

        {step === 2 && (
          <section aria-labelledby="s2">
            <h1 id="s2" className="headline text-3xl">How fast?</h1>
            <div className="mt-6 grid gap-2">
              {(Object.values(DELIVERY_METHODS) as (typeof DELIVERY_METHODS)[DeliveryMethod][]).map((m) => {
                const price = computePricing(cart.subtotal, m.id).shipping;
                return (
                  <button key={m.id} type="button" onClick={() => setDelivery(m.id)} className={cn("flex items-center justify-between rounded-[var(--r-lg)] border p-4 text-left transition-colors", delivery === m.id ? "border-fg" : "border-line hover:border-line-strong")} aria-pressed={delivery === m.id}>
                    <div>
                      <p className="text-[15px] text-fg">{m.label}</p>
                      <p className="meta mt-0.5">{m.eta}</p>
                    </div>
                    <span className="tabular text-[14px]">{price === 0 ? "Free" : formatPrice(price)}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-8 flex gap-3">
              <Button variant="secondary" size="lg" onClick={() => setStep(1)}>Back</Button>
              <Button size="lg" onClick={() => setStep(3)}>Continue to payment <ArrowRight className="h-4 w-4" /></Button>
            </div>
          </section>
        )}

        {step === 3 && (
          <section aria-labelledby="s3">
            <h1 id="s3" className="headline text-3xl">Payment</h1>
            <div className="mt-6 rounded-[var(--r-lg)] border border-fg p-5">
              <p className="text-[15px] text-fg">{mode === "stripe" ? "Pay securely with Stripe" : "Test gateway"}</p>
              <p className="mt-1 text-[14px] text-fg-muted">{mode === "stripe" ? "Cards, UPI and wallets on Stripe's hosted page. Your card details never touch our servers." : "Stripe isn't configured in this environment. A simulated payment page lets you complete the full order flow end to end."}</p>
            </div>
            <div className="mt-8 flex gap-3">
              <Button variant="secondary" size="lg" onClick={() => setStep(2)}>Back</Button>
              <Button size="lg" onClick={() => setStep(4)}>Review order <ArrowRight className="h-4 w-4" /></Button>
            </div>
          </section>
        )}

        {step === 4 && (
          <section aria-labelledby="s4">
            <h1 id="s4" className="headline text-3xl">Review</h1>
            <dl className="mt-6 divide-y divide-line border-y border-line text-[14px]">
              <div className="grid gap-1 py-4 sm:grid-cols-[120px_1fr_auto]">
                <dt className="text-fg-muted">Deliver to</dt>
                <dd className="text-fg-soft">{address.fullName}, {address.line1}{address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state} {address.postalCode}. {address.phone}</dd>
                <dd><button onClick={() => setStep(1)} className="text-fg-muted hover:text-fg">Edit</button></dd>
              </div>
              <div className="grid gap-1 py-4 sm:grid-cols-[120px_1fr_auto]">
                <dt className="text-fg-muted">Delivery</dt>
                <dd className="text-fg-soft">{DELIVERY_METHODS[delivery].label} · {DELIVERY_METHODS[delivery].eta}</dd>
                <dd><button onClick={() => setStep(2)} className="text-fg-muted hover:text-fg">Edit</button></dd>
              </div>
              <div className="grid gap-1 py-4 sm:grid-cols-[120px_1fr_auto]">
                <dt className="text-fg-muted">Payment</dt>
                <dd className="text-fg-soft">{mode === "stripe" ? "Stripe" : "Test gateway"}</dd>
                <dd><button onClick={() => setStep(3)} className="text-fg-muted hover:text-fg">Edit</button></dd>
              </div>
            </dl>
            <div className="mt-8 flex gap-3">
              <Button variant="secondary" size="lg" onClick={() => setStep(3)}>Back</Button>
              <Button size="lg" onClick={pay} loading={busy}>Pay {formatPrice(pricing.total)}</Button>
            </div>
            <p className="meta mt-3">You&rsquo;ll be taken to {mode === "stripe" ? "Stripe" : "the test gateway"} to complete payment. The order is created only once payment is confirmed.</p>
          </section>
        )}
      </div>

      <aside className="lg:sticky lg:top-8 lg:self-start">
        <div className="rounded-[var(--r-xl)] border border-line p-6">
          <h2 className="headline text-lg">{cart.count} {cart.count === 1 ? "item" : "items"}</h2>
          <ul className="mt-5 max-h-72 space-y-4 overflow-y-auto pr-1">
            {cart.items.map((l) => (
              <li key={l.id} className="flex gap-3">
                <ProductImage src={l.product.image?.url} alt="" sizes="56px" fallbackHex={l.product.colors[0]?.hex} className="h-16 w-14 shrink-0 rounded-[var(--r-sm)]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] text-fg">{l.product.name}</p>
                  <p className="meta">{l.color} · {l.size} · ×{l.quantity}</p>
                </div>
                <span className="tabular text-[13px]">{formatPrice(l.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-5 space-y-2.5 border-t border-line pt-5 text-[14px]">
            <div className="flex justify-between"><dt className="text-fg-muted">Subtotal</dt><dd className="tabular">{formatPrice(pricing.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-fg-muted">Delivery</dt><dd className="tabular">{pricing.shipping === 0 ? "Free" : formatPrice(pricing.shipping)}</dd></div>
            <div className="flex justify-between"><dt className="text-fg-muted">GST (5%)</dt><dd className="tabular">{formatPrice(pricing.tax)}</dd></div>
            <div className="flex justify-between border-t border-line pt-3 text-[15px]"><dt>Total</dt><dd className="tabular text-fg">{formatPrice(pricing.total)}</dd></div>
          </dl>
        </div>
      </aside>
    </div>
  );
}
