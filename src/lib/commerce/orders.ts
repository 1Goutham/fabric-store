import { connectDB } from "@/lib/db";
import { Order } from "@/lib/models/Order";
import { errors } from "@/lib/api/respond";
import { toOrder } from "./serialize";
import type { OrderStatus } from "@/lib/constants";
import type { OrderDTO, Pagination } from "@/types";

export async function listMyOrders(userId: string): Promise<OrderDTO[]> {
  await connectDB();
  const orders = await Order.find({ user: userId }).sort({ createdAt: -1 }).limit(50).lean();
  return orders.map((o) => toOrder(o));
}

export async function getMyOrder(userId: string, orderId: string): Promise<OrderDTO> {
  await connectDB();
  const order = await Order.findOne({ _id: orderId, user: userId }).lean();
  if (!order) throw errors.notFound("We couldn't find that order.");
  return toOrder(order);
}

export async function adminListOrders(q: { page: number; pageSize: number; status?: OrderStatus; search?: string }): Promise<{ orders: OrderDTO[]; pagination: Pagination; totalRevenue: number }> {
  await connectDB();
  const filter: Record<string, unknown> = {};
  if (q.status) filter.status = q.status;
  if (q.search) filter.orderNumber = { $regex: q.search.trim().toUpperCase(), $options: "i" };
  const [docs, total, revenue] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((q.page - 1) * q.pageSize).limit(q.pageSize).populate<{ user: { _id: { toString(): string }; name: string; email: string } | null }>("user", "name email").lean(),
    Order.countDocuments(filter),
    Order.aggregate<{ total: number }>([{ $match: { status: { $ne: "cancelled" } } }, { $group: { _id: null, total: { $sum: "$pricing.total" } } }]),
  ]);
  return {
    orders: docs.map((o) => toOrder(o, o.user)),
    pagination: { page: q.page, pageSize: q.pageSize, total, totalPages: Math.max(1, Math.ceil(total / q.pageSize)) },
    totalRevenue: revenue[0]?.total ?? 0,
  };
}

export async function adminGetOrder(orderId: string): Promise<OrderDTO> {
  await connectDB();
  const order = await Order.findById(orderId).populate<{ user: { _id: { toString(): string }; name: string; email: string } | null }>("user", "name email").lean();
  if (!order) throw errors.notFound("Order not found.");
  return toOrder(order, order.user);
}

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export async function adminUpdateOrderStatus(orderId: string, status: OrderStatus, note?: string): Promise<OrderDTO> {
  await connectDB();
  const order = await Order.findById(orderId);
  if (!order) throw errors.notFound("Order not found.");
  const current = order.status as OrderStatus;
  if (current === status) return toOrder(order.toObject());
  if (!TRANSITIONS[current].includes(status)) {
    throw errors.badRequest(`An order that is ${current} can't move to ${status}.`);
  }
  order.status = status;
  order.timeline.push({ status, at: new Date(), note });
  if (status === "delivered") order.deliveredAt = new Date();
  await order.save();
  return toOrder(order.toObject());
}
