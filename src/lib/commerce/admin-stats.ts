import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { Product } from "@/lib/models/Product";
import { User } from "@/lib/models/User";
import { toOrder } from "./serialize";

export async function getAdminStats() {
  await connectDB();
  const since = new Date(Date.now() - 30 * 86400000);
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const [revenueAgg, ordersByStatus, daily, lowStock, customers, products, recent, topProducts] = await Promise.all([
    Order.aggregate<{ _id: null; total: number; count: number; aov: number }>([
      { $match: { status: { $ne: "cancelled" } } },
      { $group: { _id: null, total: { $sum: "$pricing.total" }, count: { $sum: 1 }, aov: { $avg: "$pricing.total" } } },
    ]),
    Order.aggregate<{ _id: string; n: number }>([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
    Order.aggregate<{ _id: string; revenue: number; orders: number }>([
      { $match: { createdAt: { $gte: since }, status: { $ne: "cancelled" } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, revenue: { $sum: "$pricing.total" }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Product.find({ status: "active", stock: { $lte: 5 } }).sort({ stock: 1 }).limit(8).select("name slug stock images").lean(),
    User.countDocuments({ role: "customer" }),
    Product.countDocuments({ status: "active" }),
    Order.find().sort({ createdAt: -1 }).limit(6).populate<{ user: { _id: { toString(): string }; name: string; email: string } | null }>("user", "name email").lean(),
    Product.find({ status: "active" }).sort({ salesCount: -1 }).limit(5).select("name slug salesCount price images").lean(),
  ]);
  const days: { date: string; revenue: number; orders: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    const hit = daily.find((x) => x._id === d);
    days.push({ date: d, revenue: hit?.revenue ?? 0, orders: hit?.orders ?? 0 });
  }
  return {
    revenue: revenueAgg[0]?.total ?? 0,
    orders: revenueAgg[0]?.count ?? 0,
    aov: Math.round(revenueAgg[0]?.aov ?? 0),
    customers,
    products,
    byStatus: Object.fromEntries(ordersByStatus.map((s) => [s._id, s.n])),
    daily: days,
    lowStock: lowStock.map((p) => ({ id: p._id.toString(), name: p.name, slug: p.slug, stock: p.stock ?? 0, image: p.images?.[0]?.url ?? null })),
    recentOrders: recent.map((o) => toOrder(o, o.user)),
    topProducts: topProducts.map((p) => ({ id: p._id.toString(), name: p.name, slug: p.slug, sales: p.salesCount ?? 0, price: p.price, image: p.images?.[0]?.url ?? null })),
  };
}
