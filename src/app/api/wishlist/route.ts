import { handle, ok } from "@/lib/api/respond";
import { requireUser } from "@/lib/auth/session";
import { getWishlist } from "@/lib/commerce/wishlist";

export const GET = handle(async () => {
  const user = await requireUser();
  return ok({ wishlist: await getWishlist(user.id) });
});
