"use client";
import { create } from "zustand";
import type { ProductCard, WishlistDTO } from "@/types";
import { api } from "@/lib/client/api";

interface WishlistState {
  wishlist: WishlistDTO;
  loaded: boolean;
  load: () => Promise<void>;
  reset: () => void;
  isSaved: (productId: string) => boolean;
  toggle: (product: ProductCard) => Promise<boolean>;
  move: (itemId: string, collectionId: string | null) => Promise<void>;
  remove: (itemId: string) => Promise<void>;
  createCollection: (name: string) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
}

const empty: WishlistDTO = { items: [], collections: [] };

export const useWishlist = create<WishlistState>((set, get) => ({
  wishlist: empty,
  loaded: false,
  reset: () => set({ wishlist: empty, loaded: false }),
  load: async () => {
    try {
      const { wishlist } = await api.get<{ wishlist: WishlistDTO }>("/api/wishlist");
      set({ wishlist, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },
  isSaved: (productId) => get().wishlist.items.some((i) => i.product.id === productId),
  toggle: async (product) => {
    const prev = get().wishlist;
    const saved = prev.items.some((i) => i.product.id === product.id);
    const items = saved
      ? prev.items.filter((i) => i.product.id !== product.id)
      : [{ id: `tmp-${Date.now()}`, product, collectionId: null, addedAt: new Date().toISOString() }, ...prev.items];
    set({ wishlist: { ...prev, items } });
    try {
      const res = await api.post<{ saved: boolean; wishlist: WishlistDTO }>("/api/wishlist/items", { productId: product.id });
      set({ wishlist: res.wishlist });
      return res.saved;
    } catch (err) {
      set({ wishlist: prev });
      throw err;
    }
  },
  move: async (itemId, collectionId) => {
    const prev = get().wishlist;
    set({ wishlist: { ...prev, items: prev.items.map((i) => (i.id === itemId ? { ...i, collectionId } : i)) } });
    try {
      const { wishlist } = await api.patch<{ wishlist: WishlistDTO }>("/api/wishlist/items", { itemId, collectionId });
      set({ wishlist });
    } catch (err) {
      set({ wishlist: prev });
      throw err;
    }
  },
  remove: async (itemId) => {
    const prev = get().wishlist;
    set({ wishlist: { ...prev, items: prev.items.filter((i) => i.id !== itemId) } });
    try {
      const { wishlist } = await api.delete<{ wishlist: WishlistDTO }>(`/api/wishlist/items?itemId=${itemId}`);
      set({ wishlist });
    } catch (err) {
      set({ wishlist: prev });
      throw err;
    }
  },
  createCollection: async (name) => {
    const { wishlist } = await api.post<{ wishlist: WishlistDTO }>("/api/wishlist/collections", { name });
    set({ wishlist });
  },
  deleteCollection: async (id) => {
    const { wishlist } = await api.delete<{ wishlist: WishlistDTO }>(`/api/wishlist/collections/${id}`);
    set({ wishlist });
  },
}));
