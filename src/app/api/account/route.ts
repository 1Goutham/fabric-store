import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { handle, ok, parseBody, errors } from "@/lib/api/respond";
import { requireUser, serializeUser } from "@/lib/auth/session";
import { updateProfileSchema } from "@/lib/validation/auth";
import { setStyleTags, getStyleProfile, describeStyle } from "@/lib/intelligence/preferences";

export const GET = handle(async () => {
  const user = await requireUser();
  const profile = await getStyleProfile(user.id);
  return ok({ user, style: { tags: profile.styleTags, derived: describeStyle(profile), hasSignals: profile.hasSignals } });
});

export const PATCH = handle(async (req) => {
  const current = await requireUser();
  const input = await parseBody(req, updateProfileSchema);
  await connectDB();
  const update: Record<string, unknown> = {};
  if (input.name !== undefined) update.name = input.name;
  if (input.avatarUrl !== undefined) update.avatarUrl = input.avatarUrl || undefined;
  if (input.addresses !== undefined) {
    let defaultSeen = false;
    update.addresses = input.addresses.map((a) => {
      const isDefault = Boolean(a.isDefault) && !defaultSeen;
      if (isDefault) defaultSeen = true;
      return { ...a, line2: a.line2 || undefined, isDefault, _id: a.id && /^[a-f\d]{24}$/i.test(a.id) ? a.id : undefined };
    });
  }
  const user = await User.findByIdAndUpdate(current.id, { $set: update }, { new: true, runValidators: true }).lean();
  if (!user) throw errors.notFound();
  if (input.styleTags) await setStyleTags(current.id, input.styleTags);
  return ok({ user: serializeUser(user) });
});
