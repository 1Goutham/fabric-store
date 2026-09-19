import { handle, ok, parseBody } from "@/lib/api/respond";
import { requireUser } from "@/lib/auth/session";
import { wishlistCollectionSchema } from "@/lib/validation/commerce";
import { createCollection } from "@/lib/commerce/wishlist";

export const POST = handle(async (req) => {
  const user = await requireUser();
  const { name } = await parseBody(req, wishlistCollectionSchema);
  return ok({ wishlist: await createCollection(user.id, name) }, { status: 201 });
});
