import { handle, ok } from "@/lib/api/respond";
import { requireUser } from "@/lib/auth/session";
import { deleteCollection } from "@/lib/commerce/wishlist";

type Ctx = { params: Promise<{ id: string }> };

export const DELETE = handle<Ctx>(async (_req, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  return ok({ wishlist: await deleteCollection(user.id, id) });
});
