"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { FABRICS, FITS, GENDERS, MOODS, SIZES } from "@/lib/constants";
import type { CategoryDTO, ProductDetail } from "@/types";
import { api, ApiClientError, messageOf } from "@/lib/client/api";
import { toast } from "@/lib/store/ui";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Checkbox } from "@/components/ui/field";
import { ProductImage } from "@/components/commerce/product-image";
import { slugify } from "@/lib/commerce/slug";
import { cn } from "@/lib/client/cn";

type Initial = ProductDetail & { categoryId: string; status: string; featured: boolean; pairsWith: string[] };

interface FormState {
  name: string; slug: string; description: string; story: string; price: string; compareAtPrice: string; categoryId: string; fabric: string; material: string; fit: string; care: string; gender: string;
  colors: { name: string; hex: string }[]; sizes: string[]; images: { url: string; alt: string }[]; tags: string; moods: string[]; occasions: string; seasons: string; featured: boolean; status: string;
  stock: Record<string, number>;
}

function fromInitial(p?: Initial): FormState {
  return {
    name: p?.name ?? "", slug: p?.slug ?? "", description: p?.description ?? "", story: p?.story ?? "", price: p ? String(p.price) : "", compareAtPrice: p?.compareAtPrice ? String(p.compareAtPrice) : "",
    categoryId: p?.categoryId ?? "", fabric: p?.fabric ?? "Cotton", material: p?.material ?? "", fit: p?.fit ?? "regular", care: p?.care.join("\n") ?? "", gender: p?.gender ?? "unisex",
    colors: p?.colors ?? [{ name: "Black", hex: "#141414" }], sizes: p?.sizes ?? ["S", "M", "L"], images: p?.images ?? [], tags: p?.tags.join(", ") ?? "", moods: p?.moods ?? [], occasions: p?.occasions.join(", ") ?? "", seasons: p?.seasons.join(", ") ?? "",
    featured: p?.featured ?? false, status: p?.status ?? "active",
    stock: Object.fromEntries((p?.variants ?? []).map((v) => [`${v.color}|${v.size}`, v.stock])),
  };
}

const list = (s: string) => s.split(/[,\n]/).map((x) => x.trim()).filter(Boolean);

export function ProductForm({ categories, initial }: { categories: CategoryDTO[]; initial?: Initial }) {
  const router = useRouter();
  const [f, setF] = useState<FormState>(() => fromInitial(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<"save" | "archive" | null>(null);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((s) => ({ ...s, [k]: v }));

  const matrix = useMemo(() => f.colors.flatMap((c) => f.sizes.map((s) => ({ key: `${c.name}|${s}`, color: c.name, size: s }))), [f.colors, f.sizes]);
  const totalStock = matrix.reduce((n, m) => n + (f.stock[m.key] ?? 0), 0);
  const slug = f.slug || slugify(f.name);

  const payload = () => ({
    name: f.name, slug: slug || undefined, description: f.description, story: f.story, price: Number(f.price), compareAtPrice: f.compareAtPrice ? Number(f.compareAtPrice) : null,
    categoryId: f.categoryId, fabric: f.fabric, material: f.material, fit: f.fit, care: list(f.care), gender: f.gender, colors: f.colors.filter((c) => c.name.trim()), sizes: f.sizes,
    variants: matrix.map((m) => ({ sku: `${slug}-${slugify(m.color)}-${m.size.toLowerCase().replace(/\s+/g, "")}`.toUpperCase(), color: m.color, size: m.size, stock: f.stock[m.key] ?? 0 })),
    images: f.images.filter((i) => i.url.trim()), tags: list(f.tags).map((t) => t.toLowerCase()), moods: f.moods, occasions: list(f.occasions).map((t) => t.toLowerCase()), seasons: list(f.seasons).map((t) => t.toLowerCase()),
    featured: f.featured, status: f.status,
  });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy("save");
    setErrors({});
    try {
      if (initial) {
        await api.patch(`/api/products/${initial.id}`, payload());
        toast({ title: "Product saved", tone: "success" });
      } else {
        const { product } = await api.post<{ product: ProductDetail }>("/api/products", payload());
        toast({ title: "Product created", tone: "success" });
        router.replace(`/admin/products/${product.id}`);
      }
      router.refresh();
    } catch (err) {
      if (err instanceof ApiClientError && err.fields) setErrors(err.fields);
      toast({ title: "Couldn't save", description: messageOf(err), tone: "danger" });
    } finally {
      setBusy(null);
    }
  };

  const archive = async () => {
    if (!initial || !confirm(`Archive “${initial.name}”? It disappears from the storefront; order history is kept.`)) return;
    setBusy("archive");
    try {
      await api.delete(`/api/products/${initial.id}`);
      toast({ title: "Product archived" });
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      toast({ title: "Couldn't archive", description: messageOf(err), tone: "danger" });
      setBusy(null);
    }
  };

  return (
    <form onSubmit={save} className="grid gap-10 lg:grid-cols-[1fr_340px]">
      <div className="space-y-10">
        <Section title="Basics">
          <Input label="Name" value={f.name} onChange={(e) => set("name", e.target.value)} error={errors.name} required />
          <Input label="Slug" value={f.slug} onChange={(e) => set("slug", e.target.value)} placeholder={slugify(f.name) || "auto"} error={errors.slug} hint={`/products/${slug || "…"}`} />
          <Textarea label="Description" value={f.description} onChange={(e) => set("description", e.target.value)} error={errors.description} maxLength={600} />
          <Textarea label="Story (details section)" value={f.story} onChange={(e) => set("story", e.target.value)} maxLength={2000} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Price (₹)" type="number" min={0} value={f.price} onChange={(e) => set("price", e.target.value)} error={errors.price} required />
            <Input label="Compare-at price (₹)" type="number" min={0} value={f.compareAtPrice} onChange={(e) => set("compareAtPrice", e.target.value)} error={errors.compareAtPrice} />
          </div>
        </Section>

        <Section title="Attributes">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Category" value={f.categoryId} onChange={(e) => set("categoryId", e.target.value)} error={errors.categoryId}>
              <option value="" className="bg-surface">Choose…</option>
              {categories.map((c) => <option key={c.id} value={c.id} className="bg-surface">{c.name}</option>)}
            </Select>
            <Select label="Fabric" value={f.fabric} onChange={(e) => set("fabric", e.target.value)}>{FABRICS.map((x) => <option key={x} className="bg-surface">{x}</option>)}</Select>
            <Select label="Fit" value={f.fit} onChange={(e) => set("fit", e.target.value)}>{FITS.map((x) => <option key={x} className="bg-surface">{x}</option>)}</Select>
            <Select label="Gender" value={f.gender} onChange={(e) => set("gender", e.target.value)}>{GENDERS.map((x) => <option key={x} className="bg-surface">{x}</option>)}</Select>
          </div>
          <Input label="Material" value={f.material} onChange={(e) => set("material", e.target.value)} placeholder="100% European flax linen, 180 gsm" />
          <Textarea label="Care (one per line)" value={f.care} onChange={(e) => set("care", e.target.value)} />
          <div>
            <p className="mb-2 text-[12px] tracking-wide text-fg-muted">Moods</p>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((m) => (
                <button key={m.slug} type="button" aria-pressed={f.moods.includes(m.slug)} onClick={() => set("moods", f.moods.includes(m.slug) ? f.moods.filter((x) => x !== m.slug) : [...f.moods, m.slug])} className={cn("h-9 rounded-full border px-3.5 text-[13px]", f.moods.includes(m.slug) ? "border-fg bg-fg text-bg" : "border-line text-fg-soft")}>
                  {m.name}
                </button>
              ))}
            </div>
          </div>
          <Input label="Tags (comma separated)" value={f.tags} onChange={(e) => set("tags", e.target.value)} placeholder="linen, summer, breathable" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Occasions" value={f.occasions} onChange={(e) => set("occasions", e.target.value)} placeholder="dinner, office, travel" />
            <Input label="Seasons" value={f.seasons} onChange={(e) => set("seasons", e.target.value)} placeholder="summer, spring" />
          </div>
        </Section>

        <Section title="Colours & sizes">
          <div className="space-y-2">
            {f.colors.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <input type="color" value={c.hex} onChange={(e) => set("colors", f.colors.map((x, idx) => (idx === i ? { ...x, hex: e.target.value } : x)))} aria-label="Colour swatch" className="h-10 w-12 cursor-pointer rounded-[var(--r-sm)] border border-line bg-transparent" />
                <Input value={c.name} onChange={(e) => set("colors", f.colors.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)))} placeholder="Colour name" aria-label="Colour name" wrapperClassName="flex-1" />
                <button type="button" onClick={() => set("colors", f.colors.filter((_, idx) => idx !== i))} aria-label="Remove colour" className="p-2 text-fg-muted hover:text-danger"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
            <button type="button" onClick={() => set("colors", [...f.colors, { name: "", hex: "#888888" }])} className="inline-flex items-center gap-1 text-[13px] text-fg-muted hover:text-fg"><Plus className="h-3.5 w-3.5" /> Add colour</button>
            {errors.colors && <p className="text-[12px] text-danger">{errors.colors}</p>}
          </div>
          <div>
            <p className="mb-2 text-[12px] tracking-wide text-fg-muted">Sizes</p>
            <div className="flex flex-wrap gap-2">
              {SIZES.map((s) => (
                <button key={s} type="button" aria-pressed={f.sizes.includes(s)} onClick={() => set("sizes", f.sizes.includes(s) ? f.sizes.filter((x) => x !== s) : [...SIZES].filter((x) => x === s || f.sizes.includes(x)))} className={cn("h-9 rounded-full border px-3.5 text-[13px]", f.sizes.includes(s) ? "border-fg bg-fg text-bg" : "border-line text-fg-soft")}>
                  {s}
                </button>
              ))}
            </div>
            {errors.sizes && <p className="mt-1 text-[12px] text-danger">{errors.sizes}</p>}
          </div>
        </Section>

        <Section title={`Inventory · ${totalStock} units`}>
          <div className="overflow-x-auto rounded-[var(--r-md)] border border-line">
            <table className="w-full text-[13px]">
              <thead><tr><th className="px-3 py-2 text-left text-[11px] uppercase tracking-wider text-fg-muted">Colour</th>{f.sizes.map((s) => <th key={s} className="px-2 py-2 text-center text-[11px] uppercase tracking-wider text-fg-muted">{s}</th>)}</tr></thead>
              <tbody>
                {f.colors.filter((c) => c.name).map((c) => (
                  <tr key={c.name} className="border-t border-line">
                    <td className="px-3 py-1.5 text-fg-soft"><span className="mr-2 inline-block h-3 w-3 rounded-full border border-white/10 align-middle" style={{ backgroundColor: c.hex }} />{c.name}</td>
                    {f.sizes.map((s) => (
                      <td key={s} className="px-1 py-1.5 text-center">
                        <input type="number" min={0} value={f.stock[`${c.name}|${s}`] ?? 0} onChange={(e) => set("stock", { ...f.stock, [`${c.name}|${s}`]: Math.max(0, Number(e.target.value) || 0) })} aria-label={`Stock for ${c.name} ${s}`} className="tabular h-9 w-16 rounded-[6px] border border-line bg-surface text-center text-fg focus:border-line-strong focus:outline-none" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </div>

      <aside className="space-y-8 lg:sticky lg:top-[calc(var(--nav-h)+40px)] lg:self-start">
        <Section title="Images">
          <div className="space-y-3">
            {f.images.map((img, i) => (
              <div key={i} className="flex items-start gap-2">
                <GripVertical className="mt-3 h-4 w-4 shrink-0 text-fg-faint" />
                <ProductImage src={img.url} alt="" sizes="48px" className="h-16 w-12 shrink-0 rounded-[4px]" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Input value={img.url} onChange={(e) => set("images", f.images.map((x, idx) => (idx === i ? { ...x, url: e.target.value } : x)))} placeholder="https://…" aria-label="Image URL" className="h-9 text-[12px]" />
                  <Input value={img.alt} onChange={(e) => set("images", f.images.map((x, idx) => (idx === i ? { ...x, alt: e.target.value } : x)))} placeholder="Alt text" aria-label="Alt text" className="h-9 text-[12px]" />
                </div>
                <div className="flex flex-col">
                  <button type="button" disabled={i === 0} onClick={() => set("images", move(f.images, i, i - 1))} aria-label="Move up" className="p-1 text-[11px] text-fg-muted hover:text-fg disabled:opacity-30">↑</button>
                  <button type="button" disabled={i === f.images.length - 1} onClick={() => set("images", move(f.images, i, i + 1))} aria-label="Move down" className="p-1 text-[11px] text-fg-muted hover:text-fg disabled:opacity-30">↓</button>
                  <button type="button" onClick={() => set("images", f.images.filter((_, idx) => idx !== i))} aria-label="Remove image" className="p-1 text-fg-muted hover:text-danger"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
            <button type="button" onClick={() => set("images", [...f.images, { url: "", alt: "" }])} disabled={f.images.length >= 8} className="inline-flex items-center gap-1 text-[13px] text-fg-muted hover:text-fg disabled:opacity-40"><Plus className="h-3.5 w-3.5" /> Add image URL</button>
            <p className="meta">Paste hosted image URLs (Cloudinary, Vercel Blob, Unsplash). First image is the cover; second is the hover.</p>
          </div>
        </Section>
        <Section title="Visibility">
          <Select label="Status" value={f.status} onChange={(e) => set("status", e.target.value)}>
            {["active", "draft", "archived"].map((s) => <option key={s} className="bg-surface">{s}</option>)}
          </Select>
          <Checkbox label="Featured on homepage" checked={f.featured} onChange={(e) => set("featured", e.target.checked)} />
        </Section>
        <div className="flex flex-col gap-3">
          <Button type="submit" size="lg" loading={busy === "save"}>{initial ? "Save changes" : "Create product"}</Button>
          {initial && initial.status !== "archived" && <Button type="button" variant="danger" onClick={archive} loading={busy === "archive"}>Archive product</Button>}
        </div>
      </aside>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[var(--r-lg)] border border-line p-5">
      <h2 className="mb-5 text-[14px] text-fg">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function move<T>(arr: T[], from: number, to: number) {
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
