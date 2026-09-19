"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import type { CategoryDTO } from "@/types";
import { api, ApiClientError, messageOf } from "@/lib/client/api";
import { toast } from "@/lib/store/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { Table, Th, Td } from "./ui";

export function CategoryManager({ initial }: { initial: CategoryDTO[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [draft, setDraft] = useState({ name: "", description: "", image: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy("new");
    setErrors({});
    try {
      const { category } = await api.post<{ category: CategoryDTO }>("/api/categories", draft);
      setRows((r) => [...r, { ...category, productCount: 0 }]);
      setDraft({ name: "", description: "", image: "" });
      toast({ title: "Category added", tone: "success" });
      router.refresh();
    } catch (err) {
      if (err instanceof ApiClientError && err.fields) setErrors(err.fields);
      toast({ title: "Couldn't add", description: messageOf(err), tone: "danger" });
    } finally {
      setBusy(null);
    }
  };

  const save = async (c: CategoryDTO) => {
    setBusy(c.id);
    try {
      await api.patch(`/api/categories/${c.id}`, { name: c.name, description: c.description ?? "", image: c.image ?? "" });
      toast({ title: "Saved", tone: "success" });
      router.refresh();
    } catch (err) {
      toast({ title: "Couldn't save", description: messageOf(err), tone: "danger" });
    } finally {
      setBusy(null);
    }
  };

  const remove = async (c: CategoryDTO) => {
    if (!confirm(`Delete “${c.name}”?`)) return;
    setBusy(c.id);
    try {
      await api.delete(`/api/categories/${c.id}`);
      setRows((r) => r.filter((x) => x.id !== c.id));
      toast({ title: "Category deleted" });
      router.refresh();
    } catch (err) {
      toast({ title: "Couldn't delete", description: messageOf(err), tone: "danger" });
    } finally {
      setBusy(null);
    }
  };

  const edit = (id: string, patch: Partial<CategoryDTO>) => setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  return (
    <div className="space-y-8">
      <Table>
        <thead><tr><Th>Name</Th><Th>Slug</Th><Th>Description</Th><Th>Products</Th><Th /></tr></thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id}>
              <Td><Input value={c.name} onChange={(e) => edit(c.id, { name: e.target.value })} className="h-9 max-w-44" aria-label="Category name" /></Td>
              <Td className="font-mono text-[12px]">{c.slug}</Td>
              <Td><Input value={c.description ?? ""} onChange={(e) => edit(c.id, { description: e.target.value })} className="h-9" aria-label="Description" /></Td>
              <Td className="tabular">{c.productCount ?? 0}</Td>
              <Td className="text-right">
                <div className="inline-flex items-center gap-3 text-[12px]">
                  <button disabled={busy === c.id} onClick={() => save(c)} className="text-fg-muted hover:text-fg">Save</button>
                  <button disabled={busy === c.id || (c.productCount ?? 0) > 0} onClick={() => remove(c)} title={(c.productCount ?? 0) > 0 ? "Move products first" : "Delete"} className="text-fg-muted hover:text-danger disabled:opacity-30"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      <form onSubmit={create} className="grid gap-3 rounded-[var(--r-lg)] border border-line p-5 md:grid-cols-[1fr_2fr_2fr_auto] md:items-end">
        <Input label="New category" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} error={errors.name} required />
        <Input label="Description" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
        <Input label="Cover image URL" value={draft.image} onChange={(e) => setDraft({ ...draft, image: e.target.value })} error={errors.image} />
        <Button type="submit" loading={busy === "new"}><Plus className="h-3.5 w-3.5" /> Add</Button>
      </form>
    </div>
  );
}
