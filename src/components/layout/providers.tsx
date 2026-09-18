"use client";
import { useEffect } from "react";
import type { SessionUser } from "@/types";
import { useSession } from "@/lib/store/session";
import { useCart } from "@/lib/store/cart";
import { useWishlist } from "@/lib/store/wishlist";
import { Toaster } from "@/components/ui/toaster";

/**
 * Hydrates client stores from the server-rendered session and loads the
 * signed-in user's bag and saved items once.
 */
export function Providers({ initialUser, children }: { initialUser: SessionUser | null; children: React.ReactNode }) {
  const setUser = useSession((s) => s.setUser);
  const user = useSession((s) => s.user);
  const hydrated = useSession((s) => s.hydrated);
  const loadCart = useCart((s) => s.load);
  const resetCart = useCart((s) => s.reset);
  const loadWishlist = useWishlist((s) => s.load);
  const resetWishlist = useWishlist((s) => s.reset);

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser, setUser]);

  useEffect(() => {
    if (!hydrated) return;
    if (user) {
      void loadCart();
      void loadWishlist();
    } else {
      resetCart();
      resetWishlist();
    }
  }, [user?.id, hydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
