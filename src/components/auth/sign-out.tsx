"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSession } from "@/lib/store/session";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  const logout = useSession((s) => s.logout);
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="secondary"
      loading={busy}
      onClick={async () => {
        setBusy(true);
        await logout().catch(() => undefined);
        router.push("/");
        router.refresh();
      }}
    >
      Sign out
    </Button>
  );
}
