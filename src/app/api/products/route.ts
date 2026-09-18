import { connectDB } from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { Category } from "@/lib/models/Category";
import { handle, ok, parseBody, parseWith, errors } from "@/lib/api/respond";
import { getCurrentUser, requireAdmin } from "@/lib/auth/session";
import { listQuerySchema, productInputSchema } from "@/lib/validation/commerce";
import { listProducts } from "@/lib/commerce/product-query";
import { slugify } from "@/lib/commerce/slug";
import { toProductDetail } from "@/lib/commerce/serialize";

export const GET = handle(async (req) => {
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const q = parseWith(listQuerySchema, params);
  // Drafts and archived products are only visible to admins.
  const user = q.status ? await getCurrentUser() : null;
  const includeInactive = Boolean(q.status) && user?.role === "admin";
  const result = await listProducts(q, { includeInactive });
  return ok(result, { headers: includeInactive ? {} : { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } });
});

export const POST = handle(async (req) => {
  await requireAdmin();
  const input = await parseBody(req, productInputSchema);
  await connectDB();
  const category = await Category.findById(input.categoryId).lean();
  if (!category) throw errors.badRequest("Choose a valid category.", { categoryId: "Unknown category" });
  const slug = input.slug || slugify(input.name);
  if (await Product.exists({ slug })) throw errors.conflict("A product with that slug already exists.");
  const variants = input.variants?.length ? input.variants : buildVariants(slug, input.colors.map((c) => c.name), input.sizes, 10);
  const product = await Product.create({ ...input, slug, category: category._id, categorySlug: category.slug, variants, compareAtPrice: input.compareAtPrice ?? undefined });
  return ok({ product: toProductDetail(product.toObject(), category) }, { status: 201 });
});

export function buildVariants(slug: string, colors: string[], sizes: string[], stock: number) {
  const out: { sku: string; color: string; size: string; stock: number }[] = [];
  for (const color of colors) for (const size of sizes) out.push({ sku: `${slug}-${slugify(color)}-${size.toLowerCase().replace(/\s+/g, "")}`.toUpperCase(), color, size, stock });
  return out;
}
