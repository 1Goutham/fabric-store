"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, ShoppingBag, Heart, User, Sparkles } from "lucide-react";
import { cn } from "@/lib/client/cn";
import { useUI } from "@/lib/store/ui";
import { useCart } from "@/lib/store/cart";
import { useWishlist } from "@/lib/store/wishlist";
import { useSession } from "@/lib/store/session";
import { Logo } from "./logo";

/** Routes that bring their own chrome: checkout and auth. */
export const isFocusedRoute = (pathname: string) => ["/checkout", "/login", "/register", "/forgot-password", "/reset-password"].some((p) => pathname === p || pathname.startsWith(p + "/"));

const NAV = [
  { label: "Shop", href: "/shop" },
  { label: "Discover", href: "/discover" },
  { label: "Collections", href: "/collections" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const setSearchOpen = useUI((s) => s.setSearchOpen);
  const openAssistant = useUI((s) => s.openAssistant);
  const count = useCart((s) => s.cart.count);
  const setCartOpen = useCart((s) => s.setOpen);
  const savedCount = useWishlist((s) => s.wishlist.items.length);
  const user = useSession((s) => s.user);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setSearchOpen]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  if (isFocusedRoute(pathname)) return null;

  return (
    <header className={cn("fixed inset-x-0 top-0 z-[60] transition-[background-color,border-color,backdrop-filter] duration-500", scrolled ? "glass border-x-0 border-t-0 rounded-none shadow-none" : "border-b border-transparent")} style={{ height: "var(--nav-h)" }}>
      <div className="mx-auto flex h-full max-w-[var(--content-max)] items-center justify-between gap-6 px-5 md:px-10">
        <div className="flex items-center gap-10">
          <Logo />
          <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} aria-current={isActive(item.href) ? "page" : undefined} className={cn("relative rounded-full px-3.5 py-2 text-sm transition-colors", isActive(item.href) ? "text-fg" : "text-fg-muted hover:text-fg")}>
                {item.label}
                {isActive(item.href) && <span aria-hidden className="absolute inset-x-3.5 -bottom-px h-px bg-fg" />}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-1">
          <button onClick={() => setSearchOpen(true)} className="tactile group hidden h-10 items-center gap-2 rounded-full border border-line px-4 text-sm text-fg-muted hover:border-line-strong hover:text-fg md:inline-flex" aria-label="Search FabricNest">
            <Search className="h-4 w-4" />
            <span>Search</span>
            <kbd className="ml-3 rounded-md border border-line px-1.5 py-0.5 font-mono text-[10px] text-fg-faint">⌘K</kbd>
          </button>
          <button onClick={() => setSearchOpen(true)} className="tactile flex h-10 w-10 items-center justify-center rounded-full text-fg-soft hover:bg-white/[0.06] hover:text-fg md:hidden" aria-label="Search">
            <Search className="h-[18px] w-[18px]" />
          </button>
          <button onClick={() => openAssistant({ page: pathname })} className="tactile hidden h-10 items-center gap-2 rounded-full px-3.5 text-sm text-fg-muted hover:bg-white/[0.06] hover:text-fg md:inline-flex" aria-label="Ask FabricNest">
            <Sparkles className="h-4 w-4" />
            <span>Ask</span>
          </button>
          <Link href="/saved" className="tactile relative hidden h-10 w-10 items-center justify-center rounded-full text-fg-soft hover:bg-white/[0.06] hover:text-fg md:flex" aria-label={`Saved, ${savedCount} items`}>
            <Heart className="h-[18px] w-[18px]" />
            {savedCount > 0 && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" />}
          </Link>
          <button onClick={() => setCartOpen(true)} className="tactile relative flex h-10 items-center gap-2 rounded-full px-3 text-fg-soft hover:bg-white/[0.06] hover:text-fg" aria-label={`Bag, ${count} items`}>
            <ShoppingBag className="h-[18px] w-[18px]" />
            <span className={cn("tabular text-[13px] transition-opacity", count === 0 && "opacity-40")}>{count}</span>
          </button>
          <Link href={user ? "/account" : "/login"} className="tactile flex h-10 w-10 items-center justify-center rounded-full text-fg-soft hover:bg-white/[0.06] hover:text-fg" aria-label={user ? "Account" : "Sign in"}>
            {user ? <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-3 text-[12px] font-medium text-fg">{user.name.charAt(0).toUpperCase()}</span> : <User className="h-[18px] w-[18px]" />}
          </Link>
        </div>
      </div>
    </header>
  );
}
