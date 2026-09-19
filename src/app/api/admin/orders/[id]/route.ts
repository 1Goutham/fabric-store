import { handle, ok, parseBody } from "@/lib/api/respond";
import { requireAdmin } from "@/lib/auth/session";
import { orderStatusSchema } from "@/lib/validation/commerce";
import { adminGetOrder, adminUpdateOrderStatus } from "@/lib/commerce/orders";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle<Ctx>(async (_req, { params }) => {
  await requireAdmin();
  const { id } = await params;
  return ok({ order: await adminGetOrder(id) });
});

export const PATCH = handle<Ctx>(async (req, { params }) => {
  await requireAdmin();
  const { id } = await params;
  const { status, note } = await parseBody(req, orderStatusSchema);
  return ok({ order: await adminUpdateOrderStatus(id, status, note) });
});
