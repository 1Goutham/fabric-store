import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { handle, ok, parseBody, errors } from "@/lib/api/respond";
import { requireAdmin, serializeUser } from "@/lib/auth/session";
import { userRoleSchema } from "@/lib/validation/commerce";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handle<Ctx>(async (req, { params }) => {
  const admin = await requireAdmin();
  const { id } = await params;
  const { role } = await parseBody(req, userRoleSchema);
  await connectDB();
  if (id === admin.id && role !== "admin") throw errors.badRequest("You can't remove your own admin access.");
  const user = await User.findByIdAndUpdate(id, { $set: { role } }, { new: true }).lean();
  if (!user) throw errors.notFound("User not found.");
  return ok({ user: serializeUser(user) });
});

export const DELETE = handle<Ctx>(async (_req, { params }) => {
  const admin = await requireAdmin();
  const { id } = await params;
  if (id === admin.id) throw errors.badRequest("You can't delete your own account from here.");
  await connectDB();
  const res = await User.deleteOne({ _id: id });
  if (res.deletedCount === 0) throw errors.notFound("User not found.");
  return ok({ deleted: true });
});
