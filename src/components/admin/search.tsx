"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/client/cn";

export function AdminSearch({ placeholder, statuses, paramName = "q", statusParam = "status" }: { placeholder: string; statuses?: string[]; paramName?: string; statusParam?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get(paramName) ?? "");
  const push = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    next.delete("page");
    router.push(`${pathname}?${next.toString()}`);
  };
  const current = params.get(statusParam) ?? "all";
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <form onSubmit={(e) => { e.preventDefault(); push({ [paramName]: q || null }); }} className="flex h-10 w-full max-w-sm items-center gap-2 rounded-full border border-line px-4 focus-within:border-line-strong">
        <Search className="h-4 w-4 text-fg-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} aria-label={placeholder} className="w-full bg-transparent text-[13px] text-fg placeholder:text-fg-faint focus:outline-none" />
      </form>
      {statuses && (
        <div className="flex gap-1">
          {statuses.map((s) => (
            <button key={s} onClick={() => push({ [statusParam]: s === "all" ? null : s })} className={cn("h-9 rounded-full px-3.5 text-[12px] capitalize transition-colors", current === s ? "bg-fg text-bg" : "text-fg-muted hover:bg-white/[0.05] hover:text-fg")}>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
