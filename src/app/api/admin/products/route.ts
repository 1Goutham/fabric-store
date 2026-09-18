import { handle, ok, parseWith } from "@/lib/api/respond";
import { requireAdmin } from "@/lib/auth/session";
import { listQuerySchema } from "@/lib/validation/commerce";
import { listProducts } from "@/lib/commerce/product-query";

export const GET = handle(async (req) => {
  await requireAdmin();
  const q = parseWith(listQuerySchema, Object.fromEntries(new URL(req.url).searchParams));
  return ok(await listProducts({ ...q, status: q.status ?? "all", pageSize: q.pageSize ?? 24, sort: q.sort ?? "newest" }, { includeInactive: true }));
});
