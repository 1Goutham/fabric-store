import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { Product } from "@/lib/models/Product";
import { User } from "@/lib/models/User";
import { handle, ok } from "@/lib/api/respond";
import { requireAdmin } from "@/lib/auth/session";
import { getAdminStats } from "@/lib/commerce/admin-stats";

export const GET = handle(async () => {
  await requireAdmin();
  await connectDB();
  void Order; void Product; void User;
  return ok(await getAdminStats());
});
