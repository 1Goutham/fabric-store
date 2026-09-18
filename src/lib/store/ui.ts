"use client";
import { create } from "zustand";

export interface Toast {
  id: number;
  title: string;
  description?: string;
  tone?: "neutral" | "success" | "danger";
  action?: { label: string; onClick: () => void };
}

interface AssistantContext {
  productId?: string | null;
  page?: string | null;
  candidateIds?: string[];
  prefill?: string | null;
}

interface UIState {
  searchOpen: boolean;
  assistantOpen: boolean;
  assistantContext: AssistantContext;
  toasts: Toast[];
  setSearchOpen: (open: boolean) => void;
  openAssistant: (ctx?: AssistantContext) => void;
  closeAssistant: () => void;
  setAssistantContext: (ctx: AssistantContext) => void;
  toast: (t: Omit<Toast, "id">) => void;
  dismissToast: (id: number) => void;
}

let toastId = 0;

export const useUI = create<UIState>((set, get) => ({
  searchOpen: false,
  assistantOpen: false,
  assistantContext: {},
  toasts: [],
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  openAssistant: (ctx) => set({ assistantOpen: true, assistantContext: { ...get().assistantContext, ...(ctx ?? {}) } }),
  closeAssistant: () => set({ assistantOpen: false, assistantContext: { ...get().assistantContext, prefill: null } }),
  setAssistantContext: (ctx) => set({ assistantContext: ctx }),
  toast: (t) => {
    const id = ++toastId;
    set({ toasts: [...get().toasts, { ...t, id }] });
    setTimeout(() => get().dismissToast(id), t.action ? 6000 : 3600);
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

export const toast = (t: Omit<Toast, "id">) => useUI.getState().toast(t);
