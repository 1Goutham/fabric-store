import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { AdminSidebar } from "@/components/admin/sidebar";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · FabricNest Admin" } };
export const dynamic = "force-dynamic";

/** Admin: same DNA, denser layout. Access is re-checked server-side on every render. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="min-h-dvh bg-bg pt-[var(--nav-h)] md:grid md:grid-cols-[220px_1fr]">
      <AdminSidebar name={admin.name} />
      <main className="min-w-0 px-5 py-8 md:px-10 md:py-10">{children}</main>
    </div>
  );
}
