"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, ShoppingCart, Users, Tags, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/client/cn";

const LINKS = [
  { href: "/admin", label: "Overview", Icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", Icon: Package },
  { href: "/admin/orders", label: "Orders", Icon: ShoppingCart },
  { href: "/admin/users", label: "Users", Icon: Users },
  { href: "/admin/categories", label: "Categories", Icon: Tags },
];

export function AdminSidebar({ name }: { name: string }) {
  const pathname = usePathname();
  return (
    <aside className="border-b border-line md:sticky md:top-[var(--nav-h)] md:h-[calc(100dvh-var(--nav-h))] md:border-b-0 md:border-r">
      <div className="hidden px-5 pt-8 md:block">
        <p className="eyebrow">Admin</p>
        <p className="mt-1 text-[14px] text-fg">{name}</p>
      </div>
      <nav aria-label="Admin" className="scrollbar-hide overflow-x-auto px-3 py-3 md:mt-6 md:px-3">
        <ul className="flex gap-1 md:flex-col">
          {LINKS.map(({ href, label, Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link href={href} aria-current={active ? "page" : undefined} className={cn("flex items-center gap-2.5 whitespace-nowrap rounded-[var(--r-md)] px-3 py-2 text-[13px] transition-colors", active ? "bg-white/[0.07] text-fg" : "text-fg-muted hover:bg-white/[0.04] hover:text-fg")}>
                  <Icon className="h-4 w-4" /> {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="hidden px-5 md:absolute md:bottom-6 md:block">
        <Link href="/" className="inline-flex items-center gap-1 text-[12px] text-fg-muted hover:text-fg">
          View storefront <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
    </aside>
  );
}
