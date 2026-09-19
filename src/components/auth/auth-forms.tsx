"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { SessionUser } from "@/types";
import { api, ApiClientError, messageOf } from "@/lib/client/api";
import { useSession } from "@/lib/store/session";
import { toast } from "@/lib/store/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";

function useNext() {
  const params = useSearchParams();
  const next = params.get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/account";
}

export function LoginForm() {
  const router = useRouter();
  const next = useNext();
  const setUser = useSession((s) => s.setUser);
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setError(null);
    try {
      const { user } = await api.post<{ user: SessionUser }>("/api/auth/login", form);
      setUser(user);
      router.push(user.role === "admin" && next === "/account" ? "/admin" : next);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiClientError && err.fields) setErrors(err.fields);
      else setError(messageOf(err));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <Input label="Email" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} required />
      <Input label="Password" type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={errors.password} required />
      {error && <p role="alert" className="text-[13px] text-danger">{error}</p>}
      <div className="flex items-center justify-between">
        <Link href="/forgot-password" className="text-[13px] text-fg-muted hover:text-fg">Forgot password?</Link>
      </div>
      <Button type="submit" full size="lg" loading={busy}>Sign in</Button>
      <p className="meta text-center">Demo: aarav@example.com / password123 · admin@fabricnest.app / admin12345</p>
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const next = useNext();
  const setUser = useSession((s) => s.setUser);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setError(null);
    try {
      const { user } = await api.post<{ user: SessionUser }>("/api/auth/register", form);
      setUser(user);
      toast({ title: `Welcome, ${user.name.split(" ")[0]}`, description: "Your style profile starts now.", tone: "success" });
      router.push(next);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiClientError && err.fields) setErrors(err.fields);
      else setError(messageOf(err));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <Input label="Name" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} required />
      <Input label="Email" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} required />
      <Input label="Password" type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={errors.password} hint="At least 8 characters." required />
      {error && <p role="alert" className="text-[13px] text-danger">{error}</p>}
      <Button type="submit" full size="lg" loading={busy}>Create account</Button>
    </form>
  );
}

export function ForgotForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      await api.post("/api/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      if (err instanceof ApiClientError && err.fields) setErrors(err.fields);
      else toast({ title: "Couldn't send the link", description: messageOf(err), tone: "danger" });
    } finally {
      setBusy(false);
    }
  };
  if (sent) return <p className="rounded-[var(--r-lg)] border border-line p-5 text-[15px] text-fg-soft">If that email has an account, a reset link is on its way. It works for 30 minutes.</p>;
  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <Input label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} required />
      <Button type="submit" full size="lg" loading={busy}>Send reset link</Button>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const router = useRouter();
  const setUser = useSession((s) => s.setUser);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { user } = await api.post<{ user: SessionUser }>("/api/auth/reset-password", { token, password });
      setUser(user);
      toast({ title: "Password updated", tone: "success" });
      router.push("/account");
      router.refresh();
    } catch (err) {
      setError(messageOf(err));
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <Input label="New password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} hint="At least 8 characters." required />
      {error && <p role="alert" className="text-[13px] text-danger">{error}</p>}
      <Button type="submit" full size="lg" loading={busy}>Set new password</Button>
    </form>
  );
}
