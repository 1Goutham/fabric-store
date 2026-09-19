import { handle, ok } from "@/lib/api/respond";
import { requireUser } from "@/lib/auth/session";
import { getCartSummary, clearCart } from "@/lib/commerce/cart";

export const GET = handle(async () => {
  const user = await requireUser();
  return ok({ cart: await getCartSummary(user.id) });
});

export const DELETE = handle(async () => {
  const user = await requireUser();
  await clearCart(user.id);
  return ok({ cart: { items: [], subtotal: 0, count: 0 } });
});
