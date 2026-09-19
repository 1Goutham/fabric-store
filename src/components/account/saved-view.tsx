"use client";
import { useState } from "react";
import { Heart, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/client/cn";
import { useWishlist } from "@/lib/store/wishlist";
import { toast } from "@/lib/store/ui";
import { messageOf } from "@/lib/client/api";
import { ProductCard } from "@/components/commerce/product-card";
import { ProductGridSkeleton } from "@/components/commerce/product-grid";
import { EmptyState } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { Input } from "@/components/ui/field";

const SUGGESTED = ["Summer", "Office", "Weekend", "Maybe later"];

/** Saved: a count, simple collections, and one-tap moves. No ceremony. */
export function SavedView() {
  const { wishlist, loaded, move, remove, createCollection, deleteCollection } = useWishlist();
  const [active, setActive] = useState<string | "all" | "none">("all");
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [moving, setMoving] = useState<string | null>(null);

  const items = wishlist.items.filter((i) => (active === "all" ? true : active === "none" ? i.collectionId === null : i.collectionId === active));
  const unfiled = wishlist.items.filter((i) => i.collectionId === null).length;

  const onCreate = async (n: string) => {
    if (!n.trim()) return;
    setBusy(true);
    try {
      await createCollection(n.trim());
      setName("");
      setCreating(false);
      toast({ title: `“${n.trim()}” created`, tone: "success" });
    } catch (err) {
      toast({ title: "Couldn't create collection", description: messageOf(err), tone: "danger" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <header className="mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow mb-3">Saved</p>
          <h1 className="display text-4xl md:text-6xl">
            {wishlist.items.length} {wishlist.items.length === 1 ? "item" : "items"}
          </h1>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setCreating(true)}>
          <Plus className="h-3.5 w-3.5" /> New collection
        </Button>
      </header>

      {wishlist.collections.length > 0 && (
        <div className="scrollbar-hide -mx-5 mb-8 flex gap-2 overflow-x-auto px-5 md:mx-0 md:px-0">
          <Tab active={active === "all"} onClick={() => setActive("all")}>All · {wishlist.items.length}</Tab>
          {wishlist.collections.map((c) => (
            <Tab key={c.id} active={active === c.id} onClick={() => setActive(c.id)}>
              {c.name} · {c.count}
            </Tab>
          ))}
          {unfiled > 0 && (
            <Tab active={active === "none"} onClick={() => setActive("none")}>
              Unfiled · {unfiled}
            </Tab>
          )}
          {active !== "all" && active !== "none" && (
            <button
              onClick={async () => {
                try {
                  await deleteCollection(active);
                  setActive("all");
                } catch (err) {
                  toast({ title: "Couldn't delete", description: messageOf(err), tone: "danger" });
                }
              }}
              className="ml-2 inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[12px] text-fg-muted hover:text-danger"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete collection
            </button>
          )}
        </div>
      )}

      {!loaded ? (
        <ProductGridSkeleton />
      ) : wishlist.items.length === 0 ? (
        <EmptyState icon={<Heart className="h-8 w-8" />} title="Nothing saved yet." description="Tap the heart on anything you'd like to come back to. Collections keep them sorted." action={<Button href="/shop">Start with the shop</Button>} />
      ) : items.length === 0 ? (
        <EmptyState title="This collection is empty." description="Move saved pieces here from the menu on each card." />
      ) : (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
          {items.map((i) => (
            <li key={i.id} className="flex flex-col">
              <ProductCard product={i.product} />
              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="relative">
                  <button onClick={() => setMoving(moving === i.id ? null : i.id)} className="text-[12px] text-fg-muted hover:text-fg" aria-expanded={moving === i.id} aria-haspopup="menu">
                    {i.collectionId ? wishlist.collections.find((c) => c.id === i.collectionId)?.name ?? "Move to…" : "Move to…"}
                  </button>
                  {moving === i.id && (
                    <div role="menu" className="glass glass-strong absolute left-0 top-6 z-20 min-w-40 rounded-[var(--r-md)] p-1">
                      {[{ id: null, name: "Unfiled" }, ...wishlist.collections].map((c) => (
                        <button
                          key={c.id ?? "none"}
                          role="menuitem"
                          onClick={async () => {
                            setMoving(null);
                            try {
                              await move(i.id, c.id);
                            } catch (err) {
                              toast({ title: "Couldn't move", description: messageOf(err), tone: "danger" });
                            }
                          }}
                          className={cn("block w-full rounded-[6px] px-3 py-1.5 text-left text-[13px] hover:bg-white/[0.06]", i.collectionId === c.id ? "text-fg" : "text-fg-soft")}
                        >
                          {c.name}
                        </button>
                      ))}
                      <button role="menuitem" onClick={() => { setMoving(null); setCreating(true); }} className="block w-full rounded-[6px] px-3 py-1.5 text-left text-[13px] text-accent hover:bg-white/[0.06]">
                        + New collection
                      </button>
                    </div>
                  )}
                </div>
                <button onClick={() => remove(i.id).catch((err) => toast({ title: "Couldn't remove", description: messageOf(err), tone: "danger" }))} className="text-[12px] text-fg-muted hover:text-fg">
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Sheet open={creating} onClose={() => setCreating(false)} side="center" title="New collection" width="max-w-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onCreate(name);
          }}
          className="px-6 pb-6"
        >
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Summer" maxLength={40} data-autofocus />
          <div className="mt-3 flex flex-wrap gap-2">
            {SUGGESTED.filter((s) => !wishlist.collections.some((c) => c.name === s)).map((s) => (
              <button key={s} type="button" onClick={() => onCreate(s)} className="tactile rounded-full border border-line px-3 py-1.5 text-[12px] text-fg-soft hover:border-line-strong">
                {s}
              </button>
            ))}
          </div>
          <Button type="submit" full className="mt-6" loading={busy} disabled={!name.trim()}>
            Create
          </Button>
        </form>
      </Sheet>
    </>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn("inline-flex h-9 items-center whitespace-nowrap rounded-full border px-4 text-[13px] transition-colors", active ? "border-fg bg-fg text-bg" : "border-line text-fg-soft hover:border-line-strong")}>
      {children}
    </button>
  );
}
