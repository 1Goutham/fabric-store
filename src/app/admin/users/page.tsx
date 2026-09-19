import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { Order } from "@/lib/models/Order";
import { requireAdmin } from "@/lib/auth/session";
import { formatPrice, formatDate } from "@/lib/client/format";
import { AdminHeader, Table, Th, Td } from "@/components/admin/ui";
import { AdminSearch } from "@/components/admin/search";
import { UserRow } from "@/components/admin/user-row";

export default async function AdminUsers({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const admin = await requireAdmin();
  const raw = await searchParams;
  await connectDB();
  const filter: Record<string, unknown> = {};
  if (raw.role === "admin" || raw.role === "customer") filter.role = raw.role;
  if (raw.q) filter.$or = [{ name: { $regex: raw.q, $options: "i" } }, { email: { $regex: raw.q, $options: "i" } }];
  const users = await User.find(filter).sort({ createdAt: -1 }).limit(100).lean();
  const agg = await Order.aggregate<{ _id: { toString(): string }; n: number; spent: number }>([{ $match: { user: { $in: users.map((u) => u._id) }, status: { $ne: "cancelled" } } }, { $group: { _id: "$user", n: { $sum: 1 }, spent: { $sum: "$pricing.total" } } }]);
  const stats = new Map(agg.map((a) => [a._id.toString(), a]));
  return (
    <>
      <AdminHeader title="Users" description={`${users.length} shown`} />
      <AdminSearch placeholder="Name or email" statuses={["all", "customer", "admin"]} statusParam="role" />
      <Table className="mt-4">
        <thead><tr><Th>User</Th><Th>Role</Th><Th>Orders</Th><Th>Spent</Th><Th>Joined</Th><Th /></tr></thead>
        <tbody>
          {users.map((u) => (
            <UserRow key={u._id.toString()} user={{ id: u._id.toString(), name: u.name, email: u.email, role: u.role as "customer" | "admin", orders: stats.get(u._id.toString())?.n ?? 0, spent: formatPrice(stats.get(u._id.toString())?.spent ?? 0), joined: formatDate((u as { createdAt?: Date }).createdAt?.toISOString() ?? new Date().toISOString()) }} isSelf={u._id.toString() === admin.id} />
          ))}
          {users.length === 0 && <tr><Td className="py-10 text-center text-fg-muted">No users match.</Td><Td /><Td /><Td /><Td /><Td /></tr>}
        </tbody>
      </Table>
    </>
  );
}
