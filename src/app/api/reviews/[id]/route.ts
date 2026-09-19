import { isValidId } from "@/lib/db";
import { handle, ok, errors } from "@/lib/api/respond";
import { requireUser } from "@/lib/auth/session";
import { deleteReview } from "@/lib/commerce/reviews";

type Ctx = { params: Promise<{ id: string }> };

export const DELETE = handle<Ctx>(async (_req, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  if (!isValidId(id)) throw errors.notFound();
  await deleteReview(user.id, id, user.role === "admin");
  return ok({ deleted: true });
});
