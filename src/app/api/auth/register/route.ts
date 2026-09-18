import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { handle, ok, parseBody, errors, clientIp } from "@/lib/api/respond";
import { rateLimit } from "@/lib/api/rate-limit";
import { registerSchema } from "@/lib/validation/auth";
import { hashPassword } from "@/lib/auth/password";
import { signSession } from "@/lib/auth/jwt";
import { setSessionCookie } from "@/lib/auth/cookies";
import { serializeUser } from "@/lib/auth/session";

export const POST = handle(async (req) => {
  if (!rateLimit(`register:${clientIp(req)}`, 10, 15 * 60_000).allowed) throw errors.tooMany();
  const input = await parseBody(req, registerSchema);
  await connectDB();
  const exists = await User.exists({ email: input.email });
  if (exists) throw errors.conflict("An account with that email already exists.");
  // Role is never accepted from the client: every new account is a customer.
  const user = await User.create({ name: input.name, email: input.email, passwordHash: await hashPassword(input.password), role: "customer", lastLoginAt: new Date() });
  const token = await signSession({ sub: user._id.toString(), role: "customer", name: user.name });
  await setSessionCookie(token);
  return ok({ user: serializeUser(user.toObject()) }, { status: 201 });
});
