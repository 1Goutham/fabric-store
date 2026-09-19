import crypto from "crypto";
import { connectDB } from "@/lib/db";
import { env } from "@/lib/env";
import { User } from "@/lib/models/User";
import { handle, ok, parseBody, errors, clientIp } from "@/lib/api/respond";
import { rateLimit } from "@/lib/api/rate-limit";
import { forgotPasswordSchema } from "@/lib/validation/auth";
import { sendEmail } from "@/lib/email/send";

export const POST = handle(async (req) => {
  if (!rateLimit(`forgot:${clientIp(req)}`, 5, 15 * 60_000).allowed) throw errors.tooMany();
  const { email } = await parseBody(req, forgotPasswordSchema);
  await connectDB();
  const user = await User.findOne({ email });
  // Always answer the same way so the endpoint can't be used to enumerate accounts.
  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    user.set({ resetPasswordTokenHash: crypto.createHash("sha256").update(token).digest("hex"), resetPasswordExpiresAt: new Date(Date.now() + 30 * 60_000) });
    await user.save();
    const link = `${env.appUrl}/reset-password/${token}`;
    await sendEmail({
      to: user.email,
      subject: "Reset your FabricNest password",
      text: `Hi ${user.name},\n\nUse this link to choose a new password. It works for 30 minutes.\n\n${link}\n\nIf you didn't ask for this, you can ignore it.\n\n— FabricNest`,
    }).catch((err) => console.error("[email]", err));
  }
  return ok({ sent: true, message: "If that email has an account, a reset link is on its way." });
});
