"use client";
import { create } from "zustand";
import type { SessionUser } from "@/types";
import { api } from "@/lib/client/api";

interface SessionState {
  user: SessionUser | null;
  hydrated: boolean;
  setUser: (u: SessionUser | null) => void;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useSession = create<SessionState>((set) => ({
  user: null,
  hydrated: false,
  setUser: (user) => set({ user, hydrated: true }),
  refresh: async () => {
    try {
      const { user } = await api.get<{ user: SessionUser | null }>("/api/auth/me");
      set({ user, hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },
  logout: async () => {
    await api.post("/api/auth/logout");
    set({ user: null });
  },
}));
