"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, messageOf } from "@/lib/client/api";
import { toast } from "@/lib/store/ui";
import { Td } from "./ui";
import { Badge } from "@/components/ui/primitives";

interface Row { id: string; name: string; email: string; role: "customer" | "admin"; orders: number; spent: string; joined: string }

export function UserRow({ user, isSelf }: { user: Row; isSelf: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const setRole = async (role: "customer" | "admin") => {
    if (role === "admin" && !confirm(`Make ${user.name} an admin? They will be able to manage products, orders and users.`)) return;
    setBusy(true);
    try {
      await api.patch(`/api/admin/users/${user.id}`, { role });
      toast({ title: `${user.name} is now ${role === "admin" ? "an admin" : "a customer"}`, tone: "success" });
      router.refresh();
    } catch (err) {
      toast({ title: "Couldn't change role", description: messageOf(err), tone: "danger" });
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    if (!confirm(`Delete ${user.name}'s account? Their orders are kept for records.`)) return;
    setBusy(true);
    try {
      await api.delete(`/api/admin/users/${user.id}`);
      toast({ title: "User deleted" });
      router.refresh();
    } catch (err) {
      toast({ title: "Couldn't delete", description: messageOf(err), tone: "danger" });
      setBusy(false);
    }
  };
  return (
    <tr className="hover:bg-white/[0.02]">
      <Td><span className="text-fg">{user.name}</span>{isSelf && <span className="meta ml-2">you</span>}<p className="meta">{user.email}</p></Td>
      <Td><Badge tone={user.role === "admin" ? "accent" : "outline"}>{user.role}</Badge></Td>
      <Td className="tabular">{user.orders}</Td>
      <Td className="tabular">{user.spent}</Td>
      <Td>{user.joined}</Td>
      <Td className="text-right">
        {!isSelf && (
          <div className="inline-flex items-center gap-3 text-[12px]">
            <button disabled={busy} onClick={() => setRole(user.role === "admin" ? "customer" : "admin")} className="text-fg-muted hover:text-fg disabled:opacity-40">{user.role === "admin" ? "Make customer" : "Make admin"}</button>
            <button disabled={busy} onClick={remove} className="text-fg-muted hover:text-danger disabled:opacity-40">Delete</button>
          </div>
        )}
      </Td>
    </tr>
  );
}
