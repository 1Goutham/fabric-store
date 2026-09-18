"use client";
import { create } from "zustand";
import type { CartLine, CartSummary, ProductCard } from "@/types";
import { api } from "@/lib/client/api";

interface CartState {
  cart: CartSummary;
  loaded: boolean;
  open: boolean;
  pending: number;
  setOpen: (open: boolean) => void;
  load: () => Promise<void>;
  reset: () => void;
  add: (product: ProductCard, color: string, size: string, quantity?: number) => Promise<void>;
  update: (itemId: string, quantity: number) => Promise<void>;
  remove: (itemId: string) => Promise<void>;
}

const empty: CartSummary = { items: [], subtotal: 0, count: 0 };

const recompute = (items: CartLine[]): CartSummary => ({
  items,
  subtotal: items.reduce((s, l) => s + l.lineTotal, 0),
  count: items.reduce((s, l) => s + l.quantity, 0),
});

/**
 * Optimistic cart: the UI updates immediately, the server response replaces
 * the optimistic state, and a failure rolls back to the previous snapshot.
 */
export const useCart = create<CartState>((set, get) => ({
  cart: empty,
  loaded: false,
  open: false,
  pending: 0,
  setOpen: (open) => set({ open }),
  reset: () => set({ cart: empty, loaded: false }),
  load: async () => {
    try {
      const { cart } = await api.get<{ cart: CartSummary }>("/api/cart");
      set({ cart, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },
  add: async (product, color, size, quantity = 1) => {
    const prev = get().cart;
    const existing = prev.items.find((l) => l.product.id === product.id && l.color === color && l.size === size);
    const items = existing
      ? prev.items.map((l) => (l === existing ? { ...l, quantity: l.quantity + quantity, lineTotal: (l.quantity + quantity) * l.unitPrice } : l))
      : [
          { id: `tmp-${Date.now()}`, product, color, size, quantity, unitPrice: product.price, lineTotal: product.price * quantity, available: 99 },
          ...prev.items,
        ];
    set({ cart: recompute(items), open: true, pending: get().pending + 1 });
    try {
      const { cart } = await api.post<{ cart: CartSummary }>("/api/cart/items", { productId: product.id, color, size, quantity });
      set({ cart });
    } catch (err) {
      set({ cart: prev });
      throw err;
    } finally {
      set({ pending: Math.max(0, get().pending - 1) });
    }
  },
  update: async (itemId, quantity) => {
    const prev = get().cart;
    const items = prev.items.map((l) => (l.id === itemId ? { ...l, quantity, lineTotal: quantity * l.unitPrice } : l)).filter((l) => l.quantity > 0);
    set({ cart: recompute(items) });
    try {
      const { cart } = await api.patch<{ cart: CartSummary }>("/api/cart/items", { itemId, quantity });
      set({ cart });
    } catch (err) {
      set({ cart: prev });
      throw err;
    }
  },
  remove: async (itemId) => {
    const prev = get().cart;
    set({ cart: recompute(prev.items.filter((l) => l.id !== itemId)) });
    try {
      const { cart } = await api.delete<{ cart: CartSummary }>(`/api/cart/items?itemId=${itemId}`);
      set({ cart });
    } catch (err) {
      set({ cart: prev });
      throw err;
    }
  },
}));
