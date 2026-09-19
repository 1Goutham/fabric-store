import { connectDB } from "@/lib/db";
import { Category } from "@/lib/models/Category";
import { Product } from "@/lib/models/Product";
import { toCategory } from "@/lib/commerce/serialize";
import { AdminHeader } from "@/components/admin/ui";
import { CategoryManager } from "@/components/admin/category-manager";

export default async function AdminCategories() {
  await connectDB();
  const [cats, counts] = await Promise.all([Category.find().sort({ order: 1 }).lean(), Product.aggregate<{ _id: string; n: number }>([{ $match: { status: { $ne: "archived" } } }, { $group: { _id: "$categorySlug", n: { $sum: 1 } } }])]);
  const byslug = new Map(counts.map((c) => [c._id, c.n]));
  return (
    <>
      <AdminHeader title="Categories" description="Slugs drive storefront URLs and the intent parser's category vocabulary." />
      <CategoryManager initial={cats.map((c) => toCategory(c, byslug.get(c.slug) ?? 0))} />
    </>
  );
}
