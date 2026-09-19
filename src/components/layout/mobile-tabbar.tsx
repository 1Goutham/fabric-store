"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Sparkles, Heart, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/client/cn";
import { useCart } from "@/lib/store/cart";
import { isFocusedRoute } from "./site-header";

const TABS = [
  { label: "Home", href: "/", Icon: Home },
  { label: "Shop", href: "/shop", Icon: LayoutGrid },
  { label: "Discover", href: "/discover", Icon: Sparkles },
  { label: "Saved", href: "/saved", Icon: Heart },
  { label: "Bag", href: "/bag", Icon: ShoppingBag },
];

export function MobileTabBar() {
  const pathname = usePathname();
  const count = useCart((s) => s.cart.count);
  if (pathname.startsWith("/admin") || isFocusedRoute(pathname)) return null;
  return (
    <nav aria-label="Mobile" className="glass glass-strong pb-safe fixed inset-x-0 bottom-0 z-[60] rounded-none border-x-0 border-b-0 md:hidden" style={{ minHeight: "var(--tabbar-h)" }}>
      <ul className="grid grid-cols-5">
        {TABS.map(({ label, href, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link href={href} aria-current={active ? "page" : undefined} className={cn("relative flex h-16 flex-col items-center justify-center gap-1 text-[10px] tracking-wide transition-colors", active ? "text-fg" : "text-fg-muted")}>
                <span className="relative">
                  <Icon className="h-[20px] w-[20px]" strokeWidth={active ? 2.2 : 1.8} />
                  {href === "/bag" && count > 0 && <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-fg px-1 text-[9px] font-semibold text-bg">{count}</span>}
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
