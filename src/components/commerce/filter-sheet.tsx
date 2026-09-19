"use client";
import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/client/cn";
import { FABRICS, FITS, MOODS, SIZES } from "@/lib/constants";
import type { CategoryDTO } from "@/types";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useIsDesktop } from "@/hooks/use-media";

const COLORS = ["black", "white", "cream", "sand", "grey", "navy", "blue", "olive", "brown", "burgundy"];
const PRICE_BANDS = [
  { label: "Under ₹1,500", lte: 1500 },
  { label: "₹1,500 – ₹3,000", gte: 1500, lte: 3000 },
  { label: "₹3,000 – ₹5,000", gte: 3000, lte: 5000 },
  { label: "Over ₹5,000", gte: 5000 },
];
const SORTS = [
  { value: "relevance", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
  { value: "popular", label: "Popular" },
];

const MULTI = ["category", "fabric", "color", "size", "mood", "fit"] as const;

/**
 * Filter bar (desktop chips + sort) and a glass filter sheet (all sizes).
 * State lives in the URL so results are shareable and server-rendered.
 */
export function FilterBar({ categories, total }: { categories: CategoryDTO[]; total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const desktop = useIsDesktop();

  const get = useCallback((k: string) => params.get(k)?.split(",").filter(Boolean) ?? [], [params]);
  const activeCount = MULTI.reduce((n, k) => n + get(k).length, 0) + (params.get("price_gte") || params.get("price_lte") ? 1 : 0);

  const apply = (next: URLSearchParams) => {
    next.delete("page");
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  };
  const toggle = (k: string, v: string) => {
    const next = new URLSearchParams(params.toString());
    const cur = get(k);
    const val = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v];
    if (val.length) next.set(k, val.join(","));
    else next.delete(k);
    apply(next);
  };
  const setPrice = (band: (typeof PRICE_BANDS)[number] | null) => {
    const next = new URLSearchParams(params.toString());
    next.delete("price_gte");
    next.delete("price_lte");
    if (band?.gte) next.set("price_gte", String(band.gte));
    if (band?.lte) next.set("price_lte", String(band.lte));
    apply(next);
  };
  const setSort = (v: string) => {
    const next = new URLSearchParams(params.toString());
    if (v === "relevance") next.delete("sort");
    else next.set("sort", v);
    apply(next);
  };
  const clear = () => {
    const next = new URLSearchParams();
    if (params.get("q")) next.set("q", params.get("q")!);
    apply(next);
  };

  const priceActive = useMemo(() => PRICE_BANDS.findIndex((b) => String(b.gte ?? "") === (params.get("price_gte") ?? "") && String(b.lte ?? "") === (params.get("price_lte") ?? "")), [params]);

  const chips: { k: string; v: string; label: string }[] = [];
  for (const k of MULTI) for (const v of get(k)) chips.push({ k, v, label: k === "category" ? categories.find((c) => c.slug === v)?.name ?? v : v });

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setOpen(true)} aria-haspopup="dialog">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Filters{activeCount > 0 && <span className="ml-1 rounded-full bg-fg px-1.5 text-[10px] text-bg">{activeCount}</span>}
          </Button>
          {desktop &&
            chips.map((c) => (
              <button key={`${c.k}:${c.v}`} onClick={() => toggle(c.k, c.v)} className="tactile inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-[13px] capitalize text-fg-soft hover:border-line-strong" aria-label={`Remove ${c.label}`}>
                {c.label} <X className="h-3 w-3" />
              </button>
            ))}
          {desktop && priceActive >= 0 && (
            <button onClick={() => setPrice(null)} className="tactile inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-[13px] text-fg-soft hover:border-line-strong">
              {PRICE_BANDS[priceActive].label} <X className="h-3 w-3" />
            </button>
          )}
          {activeCount > 0 && (
            <button onClick={clear} className="link-underline text-[13px] text-fg-muted hover:text-fg">
              Clear all
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="meta tabular">{total} {total === 1 ? "piece" : "pieces"}</span>
          <label className="sr-only" htmlFor="sort">Sort</label>
          <select id="sort" value={params.get("sort") ?? "relevance"} onChange={(e) => setSort(e.target.value)} className="h-9 rounded-full border border-line bg-transparent px-3 pr-7 text-[13px] text-fg-soft focus:outline-none appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23999%22 stroke-width=%222%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:12px] bg-[right_10px_center] bg-no-repeat">
            {SORTS.map((s) => (
              <option key={s.value} value={s.value} className="bg-surface">
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Sheet open={open} onClose={() => setOpen(false)} side={desktop ? "right" : "bottom"} title="Filters" description={activeCount ? `${activeCount} applied` : "Refine by what matters"}>
        <div className="flex flex-col gap-7 px-5 pb-28 md:px-6">
          <Group label="Category">
            {categories.map((c) => (
              <Chip key={c.slug} active={get("category").includes(c.slug)} onClick={() => toggle("category", c.slug)}>
                {c.name}
              </Chip>
            ))}
          </Group>
          <Group label="Mood">
            {MOODS.map((m) => (
              <Chip key={m.slug} active={get("mood").includes(m.slug)} onClick={() => toggle("mood", m.slug)}>
                {m.name}
              </Chip>
            ))}
          </Group>
          <Group label="Price">
            {PRICE_BANDS.map((b, i) => (
              <Chip key={b.label} active={priceActive === i} onClick={() => setPrice(priceActive === i ? null : b)}>
                {b.label}
              </Chip>
            ))}
          </Group>
          <Group label="Colour">
            {COLORS.map((c) => (
              <Chip key={c} active={get("color").includes(c)} onClick={() => toggle("color", c)}>
                <span className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full border border-white/15" style={{ backgroundColor: swatch(c) }} />
                <span className="capitalize">{c}</span>
              </Chip>
            ))}
          </Group>
          <Group label="Size">
            {SIZES.map((s) => (
              <Chip key={s} active={get("size").includes(s)} onClick={() => toggle("size", s)}>
                {s}
              </Chip>
            ))}
          </Group>
          <Group label="Fabric">
            {FABRICS.map((f) => (
              <Chip key={f} active={get("fabric").includes(f)} onClick={() => toggle("fabric", f)}>
                {f}
              </Chip>
            ))}
          </Group>
          <Group label="Fit">
            {FITS.map((f) => (
              <Chip key={f} active={get("fit").includes(f)} onClick={() => toggle("fit", f)}>
                <span className="capitalize">{f}</span>
              </Chip>
            ))}
          </Group>
        </div>
        <div className="glass glass-strong pb-safe absolute inset-x-0 bottom-0 flex gap-3 rounded-none border-x-0 border-b-0 px-5 py-4 md:px-6">
          <Button variant="secondary" onClick={clear} className="flex-1">
            Clear
          </Button>
          <Button onClick={() => setOpen(false)} className="flex-1">
            Show {total} {total === 1 ? "piece" : "pieces"}
          </Button>
        </div>
      </Sheet>
    </>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="eyebrow mb-3">{label}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={active} onClick={onClick} className={cn("tactile inline-flex h-9 items-center rounded-full border px-3.5 text-[13px] transition-colors", active ? "border-fg bg-fg text-bg" : "border-line text-fg-soft hover:border-line-strong hover:text-fg")}>
      {children}
    </button>
  );
}

function swatch(c: string) {
  const map: Record<string, string> = { black: "#141414", white: "#f4f3ef", cream: "#ebe4d3", sand: "#cbb89a", grey: "#8a8a86", navy: "#1c2234", blue: "#6d84a8", olive: "#5b6142", brown: "#6b4a34", burgundy: "#5a1f2a" };
  return map[c] ?? "#666";
}
