import { connectDB } from "@/lib/db";
import { Review } from "@/lib/models/Review";
import { Order } from "@/lib/models/Order";
import { Product } from "@/lib/models/Product";
import { errors } from "@/lib/api/respond";
import { toReview } from "./serialize";
import type { ReviewDTO } from "@/types";

export async function listReviews(productId: string, currentUserId?: string | null): Promise<ReviewDTO[]> {
  await connectDB();
  const reviews = await Review.find({ product: productId }).sort({ createdAt: -1 }).limit(50).populate<{ user: { _id: { toString(): string }; name: string } }>("user", "name").lean();
  return reviews.map((r) => toReview(r, currentUserId));
}

export async function hasPurchased(userId: string, productId: string): Promise<boolean> {
  await connectDB();
  const found = await Order.exists({ user: userId, "items.product": productId, status: { $ne: "cancelled" } });
  return Boolean(found);
}

export async function upsertReview(userId: string, productId: string, input: { rating: number; title?: string; body: string }): Promise<ReviewDTO> {
  await connectDB();
  const product = await Product.exists({ _id: productId, status: "active" });
  if (!product) throw errors.notFound("Product not found.");
  const verifiedPurchase = await hasPurchased(userId, productId);
  const review = await Review.findOneAndUpdate(
    { product: productId, user: userId },
    { $set: { rating: input.rating, title: input.title || undefined, body: input.body, verifiedPurchase } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).populate<{ user: { _id: { toString(): string }; name: string } }>("user", "name");
  await recomputeRating(productId);
  return toReview(review.toObject(), userId);
}

export async function deleteReview(userId: string, reviewId: string, isAdmin = false) {
  await connectDB();
  const review = await Review.findById(reviewId);
  if (!review) throw errors.notFound("Review not found.");
  if (!isAdmin && review.user.toString() !== userId) throw errors.forbidden();
  const productId = review.product.toString();
  await review.deleteOne();
  await recomputeRating(productId);
}

async function recomputeRating(productId: string) {
  const [agg] = await Review.aggregate<{ avg: number; count: number }>([
    { $match: { product: (await Product.findById(productId).select("_id"))?._id } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  await Product.updateOne({ _id: productId }, { $set: { "rating.average": Math.round((agg?.avg ?? 0) * 10) / 10, "rating.count": agg?.count ?? 0 } });
}
