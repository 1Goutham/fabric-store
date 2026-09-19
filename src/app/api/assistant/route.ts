import { z } from "zod";
import { handle, ok, parseBody, errors, clientIp } from "@/lib/api/respond";
import { rateLimit } from "@/lib/api/rate-limit";
import { getCurrentUser } from "@/lib/auth/session";
import { askAssistant } from "@/lib/intelligence/assistant";

const schema = z.object({
  message: z.string().trim().min(1).max(400),
  context: z
    .object({
      productId: z.string().regex(/^[a-f\d]{24}$/i).nullable().optional(),
      page: z.string().max(120).nullable().optional(),
      candidateIds: z.array(z.string().regex(/^[a-f\d]{24}$/i)).max(6).optional(),
    })
    .optional(),
});

export const POST = handle(async (req) => {
  if (!rateLimit(`assistant:${clientIp(req)}`, 20, 60_000).allowed) throw errors.tooMany("The assistant needs a short breather. Try again in a minute.");
  const { message, context } = await parseBody(req, schema);
  const user = await getCurrentUser();
  const reply = await askAssistant(message, context ?? {}, user?.id ?? null);
  return ok(reply);
});
