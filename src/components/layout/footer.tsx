import Link from "next/link";
import { BRAND } from "@/lib/constants";
import { Logo } from "./logo";
import { Signature } from "./signature";

const COLS = [
  { title: "Shop", links: [{ label: "All products", href: "/shop" }, { label: "New arrivals", href: "/shop?sort=newest" }, { label: "Collections", href: "/collections" }, { label: "Discover", href: "/discover" }] },
  { title: "Account", links: [{ label: "Sign in", href: "/login" }, { label: "Orders", href: "/orders" }, { label: "Saved", href: "/saved" }, { label: "Your style", href: "/account#style" }] },
  { title: "FabricNest", links: [{ label: "About", href: "/about" }, { label: "Delivery & returns", href: "/about#delivery" }, { label: "Admin", href: "/admin" }] },
];

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line pb-[calc(var(--tabbar-h)+24px)] md:pb-12">
      <div className="mx-auto max-w-[var(--content-max)] px-5 pt-14 md:px-10">
        <div className="grid gap-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-fg-muted">{BRAND.tagline} Clothing chosen for how it wears, found the way you actually think about it.</p>
          </div>
          {COLS.map((col) => (
            <div key={col.title}>
              <p className="eyebrow mb-4">{col.title}</p>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="link-underline text-sm text-fg-soft hover:text-fg">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-col gap-4 border-t border-line pt-6 text-[12px] text-fg-faint md:flex-row md:items-center md:justify-between">
          <Signature />
          <p>Prices in INR, inclusive of GST.</p>
        </div>
      </div>
    </footer>
  );
}
