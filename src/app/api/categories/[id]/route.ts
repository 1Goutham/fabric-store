import { connectDB } from "@/lib/db";
import { Category } from "@/lib/models/Category";
import { Product } from "@/lib/models/Product";
import { handle, ok, parseBody, errors } from "@/lib/api/respond";
import { requireAdmin } from "@/lib/auth/session";
import { categoryInputSchema } from "@/lib/validation/commerce";
import { toCategory } from "@/lib/commerce/serialize";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handle<Ctx>(async (req, { params }) => {
  await requireAdmin();
  const { id } = await params;
  const input = await parseBody(req, categoryInputSchema.partial());
  await connectDB();
  const cat = await Category.findById(id);
  if (!cat) throw errors.notFound("Category not found.");
  const oldSlug = cat.slug;
  cat.set({ ...input, description: input.description || undefined, image: input.image || undefined });
  await cat.save();
  if (cat.slug !== oldSlug) await Product.updateMany({ category: cat._id }, { $set: { categorySlug: cat.slug } });
  return ok({ category: toCategory(cat.toObject()) });
});

export const DELETE = handle<Ctx>(async (_req, { params }) => {
  await requireAdmin();
  const { id } = await params;
  await connectDB();
  const inUse = await Product.countDocuments({ category: id, status: { $ne: "archived" } });
  if (inUse > 0) throw errors.conflict(`This category still has ${inUse} product${inUse === 1 ? "" : "s"}. Move them first.`);
  await Category.deleteOne({ _id: id });
  return ok({ deleted: true });
});
