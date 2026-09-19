import { z } from "zod";
import { handle, ok, parseWith } from "@/lib/api/respond";
import { requireAdmin } from "@/lib/auth/session";
import { adminListOrders } from "@/lib/commerce/orders";
import { ORDER_STATUSES } from "@/lib/constants";

const schema = z.object({ page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(20), status: z.enum(ORDER_STATUSES).optional(), search: z.string().max(40).optional() });

export const GET = handle(async (req) => {
  await requireAdmin();
  const q = parseWith(schema, Object.fromEntries(new URL(req.url).searchParams));
  return ok(await adminListOrders(q));
});
