import { handle, ok, parseBody, errors, clientIp } from "@/lib/api/respond";
import { rateLimit } from "@/lib/api/rate-limit";
import { requireUser } from "@/lib/auth/session";
import { checkoutSchema } from "@/lib/validation/commerce";
import { beginCheckout } from "@/lib/commerce/checkout";
import { paymentMode } from "@/lib/commerce/stripe";

export const GET = handle(async () => ok({ mode: paymentMode() }));

export const POST = handle(async (req) => {
  const user = await requireUser();
  if (!rateLimit(`checkout:${user.id}:${clientIp(req)}`, 10, 10 * 60_000).allowed) throw errors.tooMany();
  const input = await parseBody(req, checkoutSchema);
  const result = await beginCheckout(user.id, { address: { ...input.address, line2: input.address.line2 || undefined }, deliveryMethod: input.deliveryMethod, saveAddress: input.saveAddress });
  return ok(result);
});
