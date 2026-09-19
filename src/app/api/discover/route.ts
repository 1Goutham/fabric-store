import { z } from "zod";
import { handle, ok, parseBody, errors, clientIp } from "@/lib/api/respond";
import { rateLimit } from "@/lib/api/rate-limit";
import { getCurrentUser } from "@/lib/auth/session";
import { understandQuery } from "@/lib/intelligence/understand";
import { discover } from "@/lib/intelligence/discover";
import { getStyleProfile, recordSearchSignal } from "@/lib/intelligence/preferences";

const schema = z.object({ query: z.string().trim().min(1, "Tell us what you're looking for.").max(300), limit: z.number().int().min(1).max(48).optional() });

export const POST = handle(async (req) => {
  if (!rateLimit(`discover:${clientIp(req)}`, 30, 60_000).allowed) throw errors.tooMany();
  const { query, limit } = await parseBody(req, schema);
  const user = await getCurrentUser();
  const [intent, profile] = await Promise.all([understandQuery(query), getStyleProfile(user?.id ?? null)]);
  const result = await discover(intent, { limit: limit ?? 24, profile });
  if (user) void recordSearchSignal(user.id, query).catch(() => undefined);
  return ok(result);
});
