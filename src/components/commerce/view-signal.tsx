"use client";
import { useEffect } from "react";

/** Records a product view (anonymous: view count; signed in: personalisation). */
export function ViewSignal({ productId }: { productId: string }) {
  useEffect(() => {
    const t = setTimeout(() => {
      fetch("/api/signals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "view", productId }), keepalive: true }).catch(() => undefined);
    }, 1200);
    return () => clearTimeout(t);
  }, [productId]);
  return null;
}
