import { handle, ok } from "@/lib/api/respond";
import { getCurrentUser } from "@/lib/auth/session";
import { recommendForUser, recentlyViewed } from "@/lib/intelligence/recommend";
import { describeStyle } from "@/lib/intelligence/preferences";

export const GET = handle(async (req) => {
  const url = new URL(req.url);
  const exclude = (url.searchParams.get("exclude") ?? "").split(",").filter(Boolean);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 8), 24);
  const user = await getCurrentUser();
  const [recs, recent] = await Promise.all([recommendForUser(user?.id ?? null, { limit, excludeIds: exclude }), recentlyViewed(user?.id ?? null, 8)]);
  return ok({ items: recs.items, personalised: recs.personalised, style: describeStyle(recs.profile), recentlyViewed: recent });
});
