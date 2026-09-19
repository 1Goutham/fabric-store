import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPage() {
  return (
    <AuthShell title="Forgot your password?" subtitle="We'll email you a link to choose a new one." footer={<Link href="/login" className="link-underline text-fg">Back to sign in</Link>}>
      <ForgotForm />
    </AuthShell>
  );
}
