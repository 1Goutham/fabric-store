import { isValidId } from "@/lib/db";
import { handle, ok, parseBody, errors } from "@/lib/api/respond";
import { getCurrentUser, requireUser } from "@/lib/auth/session";
import { reviewSchema } from "@/lib/validation/commerce";
import { listReviews, upsertReview, hasPurchased } from "@/lib/commerce/reviews";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle<Ctx>(async (_req, { params }) => {
  const { id } = await params;
  if (!isValidId(id)) throw errors.notFound();
  const user = await getCurrentUser();
  const reviews = await listReviews(id, user?.id);
  const canReview = user ? { eligible: true, verified: await hasPurchased(user.id, id) } : { eligible: false, verified: false };
  return ok({ reviews, canReview });
});

export const POST = handle<Ctx>(async (req, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  if (!isValidId(id)) throw errors.notFound();
  const input = await parseBody(req, reviewSchema);
  const review = await upsertReview(user.id, id, { rating: input.rating, title: input.title || undefined, body: input.body });
  return ok({ review }, { status: 201 });
});
