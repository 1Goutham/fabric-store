"use client";
import { useEffect } from "react";
import { useCart } from "@/lib/store/cart";

/** After a confirmed order the server has already emptied the bag; sync the client store. */
export function ClearCartOnMount() {
  const load = useCart((s) => s.load);
  useEffect(() => {
    void load();
  }, [load]);
  return null;
}
