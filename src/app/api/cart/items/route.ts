import { handle, ok, parseBody, errors } from "@/lib/api/respond";
import { requireUser } from "@/lib/auth/session";
import { cartAddSchema, cartRemoveSchema, cartUpdateSchema } from "@/lib/validation/commerce";
import { addToCart, removeCartItem, updateCartItem } from "@/lib/commerce/cart";
import { recordProductSignal, recordSizeSignal } from "@/lib/intelligence/preferences";

export const POST = handle(async (req) => {
  const user = await requireUser();
  const input = await parseBody(req, cartAddSchema);
  const cart = await addToCart(user.id, input);
  void recordProductSignal(user.id, input.productId, "cart").catch(() => undefined);
  void recordSizeSignal(user.id, input.size).catch(() => undefined);
  return ok({ cart });
});

export const PATCH = handle(async (req) => {
  const user = await requireUser();
  const input = await parseBody(req, cartUpdateSchema);
  return ok({ cart: await updateCartItem(user.id, input.itemId, input.quantity) });
});

export const DELETE = handle(async (req) => {
  const user = await requireUser();
  const itemId = new URL(req.url).searchParams.get("itemId");
  const input = cartRemoveSchema.safeParse({ itemId });
  if (!input.success) throw errors.badRequest("Missing itemId.");
  return ok({ cart: await removeCartItem(user.id, input.data.itemId) });
});
