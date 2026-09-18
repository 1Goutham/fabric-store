import { connectDB } from "@/lib/db";
import { Category } from "@/lib/models/Category";
import { Product } from "@/lib/models/Product";
import { handle, ok, parseBody, errors } from "@/lib/api/respond";
import { requireAdmin } from "@/lib/auth/session";
import { categoryInputSchema } from "@/lib/validation/commerce";
import { slugify } from "@/lib/commerce/slug";
import { toCategory } from "@/lib/commerce/serialize";

export const GET = handle(async () => {
  await connectDB();
  const [cats, counts] = await Promise.all([
    Category.find().sort({ order: 1, name: 1 }).lean(),
    Product.aggregate<{ _id: string; n: number }>([{ $match: { status: "active" } }, { $group: { _id: "$categorySlug", n: { $sum: 1 } } }]),
  ]);
  const byslug = new Map(counts.map((c) => [c._id, c.n]));
  return ok({ categories: cats.map((c) => toCategory(c, byslug.get(c.slug) ?? 0)) }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
});

export const POST = handle(async (req) => {
  await requireAdmin();
  const input = await parseBody(req, categoryInputSchema);
  await connectDB();
  const slug = input.slug || slugify(input.name);
  if (await Category.exists({ slug })) throw errors.conflict("That category already exists.");
  const cat = await Category.create({ ...input, slug, description: input.description || undefined, image: input.image || undefined });
  return ok({ category: toCategory(cat.toObject()) }, { status: 201 });
});
