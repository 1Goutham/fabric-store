import { connectDB, isValidId } from "@/lib/db";
import { Product } from "@/lib/models/Product";
import { Category } from "@/lib/models/Category";
import { handle, ok, parseBody, errors } from "@/lib/api/respond";
import { getCurrentUser, requireAdmin } from "@/lib/auth/session";
import { productPatchSchema } from "@/lib/validation/commerce";
import { toProductDetail } from "@/lib/commerce/serialize";
import { buildVariants } from "../route";

type Ctx = { params: Promise<{ id: string }> };

async function findByIdOrSlug(id: string, includeInactive: boolean) {
  await connectDB();
  const filter = isValidId(id) ? { _id: id } : { slug: id };
  return Product.findOne({ ...filter, ...(includeInactive ? {} : { status: "active" }) }).populate<{ category: { slug: string; name: string } | null }>("category", "slug name").lean();
}

export const GET = handle<Ctx>(async (_req, { params }) => {
  const { id } = await params;
  const user = await getCurrentUser();
  const product = await findByIdOrSlug(id, user?.role === "admin");
  if (!product) throw errors.notFound("That product isn't available.");
  return ok({ product: toProductDetail(product, product.category) });
});

export const PATCH = handle<Ctx>(async (req, { params }) => {
  await requireAdmin();
  const { id } = await params;
  const input = await parseBody(req, productPatchSchema);
  await connectDB();
  const product = await Product.findById(id);
  if (!product) throw errors.notFound("Product not found.");
  const { categoryId, variants, ...rest } = input;
  if (categoryId) {
    const category = await Category.findById(categoryId).lean();
    if (!category) throw errors.badRequest("Choose a valid category.", { categoryId: "Unknown category" });
    product.category = category._id;
    product.categorySlug = category.slug;
  }
  if (rest.slug && rest.slug !== product.slug && (await Product.exists({ slug: rest.slug }))) throw errors.conflict("That slug is taken.");
  product.set({ ...rest, compareAtPrice: rest.compareAtPrice === null ? undefined : rest.compareAtPrice });
  if (variants) {
    product.set("variants", variants);
  } else if (rest.colors || rest.sizes) {
    // Colour/size matrix changed: keep known stock, add new cells at 0.
    const known = new Map(product.variants.map((v) => [`${v.color}|${v.size}`, v.stock]));
    const next = buildVariants(product.slug, product.colors.map((c) => c.name), product.sizes, 0).map((v) => ({ ...v, stock: known.get(`${v.color}|${v.size}`) ?? 0 }));
    product.set("variants", next);
  }
  await product.save();
  const category = await Category.findById(product.category).lean();
  return ok({ product: toProductDetail(product.toObject(), category) });
});

export const DELETE = handle<Ctx>(async (_req, { params }) => {
  await requireAdmin();
  const { id } = await params;
  await connectDB();
  const product = await Product.findById(id);
  if (!product) throw errors.notFound("Product not found.");
  // Soft delete keeps order history intact.
  product.status = "archived";
  await product.save();
  return ok({ archived: true });
});
