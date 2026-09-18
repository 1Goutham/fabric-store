import { handle, ok, parseBody } from "@/lib/api/respond";
import { getCurrentUser } from "@/lib/auth/session";
import { signalSchema } from "@/lib/validation/commerce";
import { recordProductSignal, recordSearchSignal, setStyleTags } from "@/lib/intelligence/preferences";
import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models/Product";

/** Behavioural signals. Anonymous visitors only bump product view counts. */
export const POST = handle(async (req) => {
  const input = await parseBody(req, signalSchema);
  const user = await getCurrentUser();
  if (input.type === "view" && input.productId) {
    await connectDB();
    void Product.updateOne({ _id: input.productId }, { $inc: { viewCount: 1 } }).catch(() => undefined);
    if (user) await recordProductSignal(user.id, input.productId, "view");
  } else if (input.type === "search" && input.query && user) {
    await recordSearchSignal(user.id, input.query);
  } else if (input.type === "style" && input.styleTags && user) {
    await setStyleTags(user.id, input.styleTags);
  }
  return ok({ recorded: Boolean(user) || input.type === "view" });
});
