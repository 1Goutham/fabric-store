import { handle, ok } from "@/lib/api/respond";
import { getCurrentUser } from "@/lib/auth/session";

export const GET = handle(async () => {
  const user = await getCurrentUser();
  return ok({ user });
});
