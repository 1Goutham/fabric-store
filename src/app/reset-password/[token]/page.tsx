import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Reset password" };

export default async function ResetPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <AuthShell title="Choose a new password.">
      <ResetForm token={token} />
    </AuthShell>
  );
}
