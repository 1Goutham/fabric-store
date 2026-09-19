import { z } from "zod";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { Order } from "@/lib/models/Order";
import { handle, ok, parseWith } from "@/lib/api/respond";
import { requireAdmin, serializeUser } from "@/lib/auth/session";

const schema = z.object({ page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(25), q: z.string().max(80).optional(), role: z.enum(["customer", "admin"]).optional() });

export const GET = handle(async (req) => {
  await requireAdmin();
  const q = parseWith(schema, Object.fromEntries(new URL(req.url).searchParams));
  await connectDB();
  const filter: Record<string, unknown> = {};
  if (q.role) filter.role = q.role;
  if (q.q) filter.$or = [{ name: { $regex: q.q, $options: "i" } }, { email: { $regex: q.q, $options: "i" } }];
  const [users, total] = await Promise.all([User.find(filter).sort({ createdAt: -1 }).skip((q.page - 1) * q.pageSize).limit(q.pageSize).lean(), User.countDocuments(filter)]);
  const ids = users.map((u) => u._id);
  const orderAgg = await Order.aggregate<{ _id: { toString(): string }; n: number; spent: number }>([{ $match: { user: { $in: ids }, status: { $ne: "cancelled" } } }, { $group: { _id: "$user", n: { $sum: 1 }, spent: { $sum: "$pricing.total" } } }]);
  const stats = new Map(orderAgg.map((a) => [a._id.toString(), a]));
  return ok({
    users: users.map((u) => ({ ...serializeUser(u), orders: stats.get(u._id.toString())?.n ?? 0, spent: stats.get(u._id.toString())?.spent ?? 0, lastLoginAt: u.lastLoginAt?.toISOString() ?? null })),
    pagination: { page: q.page, pageSize: q.pageSize, total, totalPages: Math.max(1, Math.ceil(total / q.pageSize)) },
  });
});
