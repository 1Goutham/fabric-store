"use client";
import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/client/cn";
import { useWishlist } from "@/lib/store/wishlist";
import { useSession } from "@/lib/store/session";
import { toast } from "@/lib/store/ui";
import { messageOf } from "@/lib/client/api";
import type { ProductCard } from "@/types";

export function SaveButton({ product, className, size = "md", showLabel }: { product: ProductCard; className?: string; size?: "sm" | "md" | "lg"; showLabel?: boolean }) {
  const router = useRouter();
  const user = useSession((s) => s.user);
  const saved = useWishlist((s) => s.wishlist.items.some((i) => i.product.id === product.id));
  const toggle = useWishlist((s) => s.toggle);
  const [pulse, setPulse] = useState(false);

  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast({ title: "Sign in to save pieces", description: "Your saved list follows you across devices.", action: { label: "Sign in", onClick: () => router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`) } });
      return;
    }
    setPulse(true);
    setTimeout(() => setPulse(false), 400);
    try {
      const nowSaved = await toggle(product);
      toast({ title: nowSaved ? "Saved" : "Removed from saved", description: nowSaved ? product.name : undefined, tone: "success", action: nowSaved ? { label: "View saved", onClick: () => router.push("/saved") } : undefined });
    } catch (err) {
      toast({ title: "Couldn't update saved items", description: messageOf(err), tone: "danger" });
    }
  };

  const dim = size === "sm" ? "h-8 w-8" : size === "lg" ? "h-12 w-12" : "h-10 w-10";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${product.name} from saved` : `Save ${product.name}`}
      className={cn("tactile inline-flex items-center justify-center gap-2 rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent", showLabel ? "h-11 border border-line-strong px-5 text-sm hover:border-fg/40" : cn(dim, "glass"), className)}
    >
      <Heart className={cn("transition-transform duration-300", size === "sm" ? "h-3.5 w-3.5" : "h-[18px] w-[18px]", saved ? "fill-fg text-fg" : "text-fg-soft", pulse && "scale-125")} />
      {showLabel && <span>{saved ? "Saved" : "Save"}</span>}
    </button>
  );
}
