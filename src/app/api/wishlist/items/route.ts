import { handle, ok, parseBody, errors } from "@/lib/api/respond";
import { requireUser } from "@/lib/auth/session";
import { wishlistAddSchema, wishlistMoveSchema } from "@/lib/validation/commerce";
import { moveWishlistItem, removeWishlistItem, toggleWishlist } from "@/lib/commerce/wishlist";
import { recordProductSignal } from "@/lib/intelligence/preferences";

export const POST = handle(async (req) => {
  const user = await requireUser();
  const input = await parseBody(req, wishlistAddSchema);
  const result = await toggleWishlist(user.id, input.productId, input.collectionId);
  if (result.saved) void recordProductSignal(user.id, input.productId, "save").catch(() => undefined);
  return ok(result);
});

export const PATCH = handle(async (req) => {
  const user = await requireUser();
  const input = await parseBody(req, wishlistMoveSchema);
  return ok({ wishlist: await moveWishlistItem(user.id, input.itemId, input.collectionId) });
});

export const DELETE = handle(async (req) => {
  const user = await requireUser();
  const itemId = new URL(req.url).searchParams.get("itemId");
  if (!itemId) throw errors.badRequest("Missing itemId.");
  return ok({ wishlist: await removeWishlistItem(user.id, itemId) });
});
