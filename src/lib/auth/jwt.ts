import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";
import type { Role } from "@/lib/constants";

export interface SessionClaims {
  sub: string;
  role: Role;
  name: string;
}

const secretKey = () => new TextEncoder().encode(env.authSecret);

export async function signSession(claims: SessionClaims): Promise<string> {
  return new SignJWT({ role: claims.role, name: claims.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setIssuer("fabricnest")
    .setExpirationTime(`${env.sessionDays}d`)
    .sign(secretKey());
}

/** Verifies signature and expiry. Runs on the Edge (middleware) and Node. */
export async function verifySession(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { issuer: "fabricnest" });
    if (!payload.sub) return null;
    return { sub: payload.sub, role: (payload.role as Role) ?? "customer", name: String(payload.name ?? "") };
  } catch {
    return null;
  }
}
