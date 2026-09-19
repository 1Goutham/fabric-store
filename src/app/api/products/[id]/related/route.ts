import { connectDB, isValidId } from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { handle, ok, errors } from "@/lib/api/respond";
import { pairsWellWith, similarProducts } from "@/lib/intelligence/recommend";

type Ctx = { params: Promise<{ id: string }> };

export const GET = handle<Ctx>(async (_req, { params }) => {
  const { id } = await params;
  await connectDB();
  const product = await Product.findOne(isValidId(id) ? { _id: id, status: "active" } : { slug: id, status: "active" }).lean();
  if (!product) throw errors.notFound();
  const [similar, pairs] = await Promise.all([similarProducts(product, 8), pairsWellWith(product, 6)]);
  return ok({ similar, pairsWith: pairs }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
});
