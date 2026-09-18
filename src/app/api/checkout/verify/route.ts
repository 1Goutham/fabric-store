import { handle, ok, errors } from "@/lib/api/respond";
import { requireUser } from "@/lib/auth/session";
import { getCheckoutForUser, verifyStripeSession } from "@/lib/commerce/checkout";
import { Order } from "@/lib/models/Order";
import { toOrder } from "@/lib/commerce/serialize";
import { isValidId } from "@/lib/db";

/**
 * Called by the success page. Confirms payment with the provider server-side
 * and returns the order (creating it if the webhook hasn't landed yet).
 */
export const GET = handle(async (req) => {
  const user = await requireUser();
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("session_id");
  const checkoutId = url.searchParams.get("checkout");

  if (sessionId) {
    const result = await verifyStripeSession(sessionId, user.id);
    return ok({ paid: result.paid, order: result.order ? toOrder(result.order) : null });
  }
  if (checkoutId && isValidId(checkoutId)) {
    const checkout = await getCheckoutForUser(checkoutId, user.id);
    if (!checkout) throw errors.notFound("Checkout not found.");
    if (checkout.status !== "completed" || !checkout.order) return ok({ paid: false, order: null, status: checkout.status });
    const order = await Order.findOne({ _id: checkout.order, user: user.id }).lean();
    return ok({ paid: true, order: order ? toOrder(order) : null });
  }
  throw errors.badRequest("Missing session reference.");
});
