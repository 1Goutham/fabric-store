import { cache } from "react";
import { connectDB } from "@/lib/db";
import { User, type UserDoc } from "@/lib/models/User";
import { errors } from "@/lib/api/respond";
import { readSessionToken } from "./cookies";
import { verifySession } from "./jwt";
import type { SessionUser } from "@/types";

/**
 * Resolve the current user from the session cookie.
 * The role is ALWAYS re-read from the database: the JWT claim is only a hint
 * used by the Edge middleware for redirects, never for authorisation.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const token = await readSessionToken();
  if (!token) return null;
  const claims = await verifySession(token);
  if (!claims) return null;
  await connectDB();
  const user = await User.findById(claims.sub).lean();
  if (!user) return null;
  return serializeUser(user);
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw errors.unauthorized();
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") throw errors.forbidden();
  return user;
}

export function serializeUser(u: UserDoc & { createdAt?: Date }): SessionUser {
  return {
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role as SessionUser["role"],
    avatarUrl: u.avatarUrl ?? null,
    addresses: (u.addresses ?? []).map((a) => ({
      id: a._id?.toString(),
      label: a.label ?? undefined,
      fullName: a.fullName,
      line1: a.line1,
      line2: a.line2 ?? undefined,
      city: a.city,
      state: a.state,
      postalCode: a.postalCode,
      country: a.country,
      phone: a.phone,
      isDefault: a.isDefault ?? false,
    })),
    createdAt: (u.createdAt ?? new Date()).toISOString(),
  };
}
