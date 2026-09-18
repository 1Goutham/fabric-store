/**
 * Email delivery for password resets. Uses SMTP when configured; otherwise the
 * message (with its link) is printed to the server log so the flow can be
 * exercised locally without any provider.
 */
export interface Mail {
  to: string;
  subject: string;
  text: string;
}

export async function sendEmail(mail: Mail): Promise<void> {
  const host = process.env.SMTP_HOST;
  if (!host) {
    console.info(`[email:dev] to=${mail.to} subject="${mail.subject}"\n${mail.text}`);
    return;
  }
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  await transporter.sendMail({ from: process.env.EMAIL_FROM ?? "FabricNest <no-reply@fabricnest.app>", ...mail });
}
