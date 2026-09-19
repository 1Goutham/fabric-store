import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { handle, ok, parseBody, errors } from "@/lib/api/respond";
import { resetPasswordSchema } from "@/lib/validation/auth";
import { hashPassword } from "@/lib/auth/password";
import { signSession } from "@/lib/auth/jwt";
import { setSessionCookie } from "@/lib/auth/cookies";
import { serializeUser } from "@/lib/auth/session";
import type { Role } from "@/lib/constants";

export const POST = handle(async (req) => {
  const { token, password } = await parseBody(req, resetPasswordSchema);
  await connectDB();
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({ resetPasswordTokenHash: hash, resetPasswordExpiresAt: { $gt: new Date() } }).select("+resetPasswordTokenHash +resetPasswordExpiresAt");
  if (!user) throw errors.badRequest("That reset link is invalid or has expired.");
  user.passwordHash = await hashPassword(password);
  user.set({ resetPasswordTokenHash: undefined, resetPasswordExpiresAt: undefined });
  await user.save();
  const session = await signSession({ sub: user._id.toString(), role: user.role as Role, name: user.name });
  await setSessionCookie(session);
  return ok({ user: serializeUser(user.toObject()) });
});
