import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <AuthShell title="Start with your name." subtitle="No questionnaire. FabricNest learns your style as you browse." footer={<>Already have an account? <Link href="/login" className="link-underline text-fg">Sign in</Link></>}>
      <Suspense>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
