import { isValidId } from "@/lib/db";
import { handle, ok, errors } from "@/lib/api/respond";
import { requireUser } from "@/lib/auth/session";
import { getMyOrder } from "@/lib/commerce/orders";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle<Ctx>(async (_req, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  if (!isValidId(id)) throw errors.notFound("We couldn't find that order.");
  return ok({ order: await getMyOrder(user.id, id) });
});
