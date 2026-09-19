"use client";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Address, SessionUser } from "@/types";
import { api, ApiClientError, messageOf } from "@/lib/client/api";
import { useSession } from "@/lib/store/session";
import { toast } from "@/lib/store/ui";
import { Button } from "@/components/ui/button";
import { Input, Checkbox } from "@/components/ui/field";

const EMPTY: Address = { label: "Home", fullName: "", line1: "", line2: "", city: "", state: "", postalCode: "", country: "India", phone: "", isDefault: false };

export function ProfileForm({ user }: { user: SessionUser }) {
  const setUser = useSession((s) => s.setUser);
  const [name, setName] = useState(user.name);
  const [addresses, setAddresses] = useState<Address[]>(user.addresses);
  const [pw, setPw] = useState({ currentPassword: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<"profile" | "password" | null>(null);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving("profile");
    setErrors({});
    try {
      const { user: u } = await api.patch<{ user: SessionUser }>("/api/account", { name, addresses });
      setUser(u);
      setAddresses(u.addresses);
      toast({ title: "Profile saved", tone: "success" });
    } catch (err) {
      if (err instanceof ApiClientError && err.fields) setErrors(err.fields);
      toast({ title: "Couldn't save", description: messageOf(err), tone: "danger" });
    } finally {
      setSaving(null);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving("password");
    setErrors({});
    try {
      await api.put("/api/account/password", pw);
      setPw({ currentPassword: "", password: "" });
      toast({ title: "Password changed", tone: "success" });
    } catch (err) {
      if (err instanceof ApiClientError && err.fields) setErrors(err.fields);
      else toast({ title: "Couldn't change password", description: messageOf(err), tone: "danger" });
    } finally {
      setSaving(null);
    }
  };

  const setAddr = (i: number, patch: Partial<Address>) => setAddresses((a) => a.map((x, idx) => (idx === i ? { ...x, ...patch } : patch.isDefault ? { ...x, isDefault: false } : x)));

  return (
    <div className="grid gap-16 lg:grid-cols-2">
      <form onSubmit={saveProfile} className="space-y-8">
        <div>
          <h2 className="headline text-2xl">Profile</h2>
          <div className="mt-5 grid gap-4">
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} />
            <Input label="Email" value={user.email} readOnly disabled hint="Email changes aren't supported yet." />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] text-fg">Addresses</h3>
            <button type="button" onClick={() => setAddresses((a) => [...a, { ...EMPTY, fullName: name, isDefault: a.length === 0 }])} disabled={addresses.length >= 6} className="inline-flex items-center gap-1 text-[13px] text-fg-muted hover:text-fg disabled:opacity-40">
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </div>
          <div className="mt-4 space-y-4">
            {addresses.length === 0 && <p className="text-[14px] text-fg-muted">No saved addresses. Add one to speed up checkout.</p>}
            {addresses.map((a, i) => (
              <fieldset key={a.id ?? i} className="rounded-[var(--r-lg)] border border-line p-4">
                <div className="flex items-center justify-between">
                  <Input value={a.label ?? ""} onChange={(e) => setAddr(i, { label: e.target.value })} placeholder="Label" className="h-9 max-w-40" aria-label="Address label" />
                  <button type="button" onClick={() => setAddresses((x) => x.filter((_, idx) => idx !== i))} className="inline-flex items-center gap-1 text-[12px] text-fg-muted hover:text-danger">
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Input label="Full name" value={a.fullName} onChange={(e) => setAddr(i, { fullName: e.target.value })} error={errors[`addresses.${i}.fullName`]} wrapperClassName="sm:col-span-2" />
                  <Input label="Address" value={a.line1} onChange={(e) => setAddr(i, { line1: e.target.value })} error={errors[`addresses.${i}.line1`]} wrapperClassName="sm:col-span-2" />
                  <Input label="Apartment (optional)" value={a.line2 ?? ""} onChange={(e) => setAddr(i, { line2: e.target.value })} wrapperClassName="sm:col-span-2" />
                  <Input label="City" value={a.city} onChange={(e) => setAddr(i, { city: e.target.value })} error={errors[`addresses.${i}.city`]} />
                  <Input label="State" value={a.state} onChange={(e) => setAddr(i, { state: e.target.value })} error={errors[`addresses.${i}.state`]} />
                  <Input label="PIN code" value={a.postalCode} onChange={(e) => setAddr(i, { postalCode: e.target.value })} error={errors[`addresses.${i}.postalCode`]} />
                  <Input label="Phone" value={a.phone} onChange={(e) => setAddr(i, { phone: e.target.value })} error={errors[`addresses.${i}.phone`]} />
                </div>
                <Checkbox label="Default address" checked={Boolean(a.isDefault)} onChange={(e) => setAddr(i, { isDefault: e.target.checked })} className="mt-3" />
              </fieldset>
            ))}
          </div>
        </div>
        <Button type="submit" loading={saving === "profile"}>Save profile</Button>
      </form>

      <form onSubmit={changePassword} className="space-y-5 self-start">
        <h2 className="headline text-2xl">Password</h2>
        <Input label="Current password" type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} error={errors.currentPassword} autoComplete="current-password" />
        <Input label="New password" type="password" value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} error={errors.password} hint="At least 8 characters." autoComplete="new-password" />
        <Button type="submit" variant="secondary" loading={saving === "password"} disabled={!pw.currentPassword || !pw.password}>
          Change password
        </Button>
      </form>
    </div>
  );
}
