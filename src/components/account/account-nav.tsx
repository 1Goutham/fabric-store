import Link from "next/link";
import { cn } from "@/lib/client/cn";

const LINKS = [
  { key: "account", label: "Profile", href: "/account" },
  { key: "orders", label: "Orders", href: "/orders" },
  { key: "saved", label: "Saved", href: "/saved" },
  { key: "style", label: "Your style", href: "/account#style" },
];

export function AccountNav({ active }: { active: string }) {
  return (
    <nav aria-label="Account" className="scrollbar-hide -mx-5 mb-8 overflow-x-auto px-5 md:mx-0 md:px-0">
      <ul className="flex gap-1 border-b border-line">
        {LINKS.map((l) => (
          <li key={l.key}>
            <Link href={l.href} aria-current={active === l.key ? "page" : undefined} className={cn("relative block whitespace-nowrap px-3 py-3 text-[13px] transition-colors", active === l.key ? "text-fg" : "text-fg-muted hover:text-fg")}>
              {l.label}
              {active === l.key && <span aria-hidden className="absolute inset-x-3 -bottom-px h-px bg-fg" />}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
