"use client";
import { useCallback, useEffect, useState } from "react";

const KEY = "fn:recent-searches";
const MAX = 6;

export function useRecentSearches() {
  const [recent, setRecent] = useState<string[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setRecent(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);
  const push = useCallback((q: string) => {
    setRecent((prev) => {
      const next = [q, ...prev.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, MAX);
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);
  const clear = useCallback(() => {
    setRecent([]);
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }, []);
  return { recent, push, clear };
}
