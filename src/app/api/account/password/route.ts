import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { handle, ok, parseBody, errors } from "@/lib/api/respond";
import { requireUser } from "@/lib/auth/session";
import { changePasswordSchema } from "@/lib/validation/auth";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

export const PUT = handle(async (req) => {
  const current = await requireUser();
  const input = await parseBody(req, changePasswordSchema);
  await connectDB();
  const user = await User.findById(current.id).select("+passwordHash");
  if (!user) throw errors.notFound();
  if (!(await verifyPassword(input.currentPassword, user.passwordHash))) throw errors.badRequest("Your current password isn't right.", { currentPassword: "Incorrect password" });
  user.passwordHash = await hashPassword(input.password);
  await user.save();
  return ok({ changed: true });
});
