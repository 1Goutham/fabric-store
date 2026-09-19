import { z } from "zod";
import { handle, ok, parseBody, errors } from "@/lib/api/respond";
import { requireUser } from "@/lib/auth/session";
import { finalizeOrder, getCheckoutForUser, markCheckoutFailed } from "@/lib/commerce/checkout";
import { paymentMode } from "@/lib/commerce/stripe";
import { toOrder } from "@/lib/commerce/serialize";

/**
 * Test payment gateway (only when Stripe is not configured). Simulates the
 * provider's "paid" / "failed" callbacks so the whole order pipeline runs.
 */
const schema = z.object({ checkoutId: z.string().regex(/^[a-f\d]{24}$/i), outcome: z.enum(["paid", "failed"]) });

export const POST = handle(async (req) => {
  if (paymentMode() !== "test") throw errors.forbidden("The test gateway is disabled when Stripe is configured.");
  const user = await requireUser();
  const { checkoutId, outcome } = await parseBody(req, schema);
  const checkout = await getCheckoutForUser(checkoutId, user.id);
  if (!checkout) throw errors.notFound("Checkout not found.");
  if (checkout.status === "completed") throw errors.conflict("This checkout was already paid.");
  if (new Date(checkout.expiresAt).getTime() < Date.now()) {
    await markCheckoutFailed(checkoutId, "expired");
    throw errors.badRequest("This checkout expired. Please start again from your bag.");
  }
  if (outcome === "failed") {
    await markCheckoutFailed(checkoutId, "failed");
    return ok({ paid: false });
  }
  const order = await finalizeOrder(checkoutId, { sessionId: `test_${checkoutId}` });
  return ok({ paid: true, order: toOrder(order) });
});
