import { handle, ok } from "@/lib/api/respond";
import { requireUser } from "@/lib/auth/session";
import { listMyOrders } from "@/lib/commerce/orders";

export const GET = handle(async () => {
  const user = await requireUser();
  return ok({ orders: await listMyOrders(user.id) });
});
