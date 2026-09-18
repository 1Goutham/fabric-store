import { handle, ok } from "@/lib/api/respond";
import { clearSessionCookie } from "@/lib/auth/cookies";

export const POST = handle(async () => {
  await clearSessionCookie();
  return ok({ signedOut: true });
});
