import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { handle, ok, parseBody, errors, clientIp } from "@/lib/api/respond";
import { rateLimit } from "@/lib/api/rate-limit";
import { loginSchema } from "@/lib/validation/auth";
import { verifyPassword } from "@/lib/auth/password";
import { signSession } from "@/lib/auth/jwt";
import { setSessionCookie } from "@/lib/auth/cookies";
import { serializeUser } from "@/lib/auth/session";
import type { Role } from "@/lib/constants";

export const POST = handle(async (req) => {
  const input = await parseBody(req, loginSchema);
  if (!rateLimit(`login:${clientIp(req)}:${input.email}`, 8, 10 * 60_000).allowed) throw errors.tooMany("Too many attempts. Try again in a few minutes.");
  await connectDB();
  const user = await User.findOne({ email: input.email }).select("+passwordHash");
  const valid = user ? await verifyPassword(input.password, user.passwordHash) : false;
  if (!user || !valid) throw errors.unauthorized("That email and password don't match.");
  user.lastLoginAt = new Date();
  await user.save();
  const token = await signSession({ sub: user._id.toString(), role: user.role as Role, name: user.name });
  await setSessionCookie(token);
  return ok({ user: serializeUser(user.toObject()) });
});
