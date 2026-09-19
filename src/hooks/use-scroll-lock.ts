"use client";
import { useEffect } from "react";

let locks = 0;
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    locks++;
    document.body.dataset.scrollLocked = "true";
    return () => {
      locks = Math.max(0, locks - 1);
      if (locks === 0) delete document.body.dataset.scrollLocked;
    };
  }, [active]);
}
