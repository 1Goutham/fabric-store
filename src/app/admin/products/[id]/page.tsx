import { notFound } from "next/navigation";
import { connectDB, isValidId } from "@/lib/db";
import { Category } from "@/lib/models/Category";
import { Product } from "@/lib/models/Product";
import { toCategory, toProductDetail } from "@/lib/commerce/serialize";
import { AdminHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";
import { Badge } from "@/components/ui/primitives";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isValidId(id)) notFound();
  await connectDB();
  const [doc, cats] = await Promise.all([Product.findById(id).lean(), Category.find().sort({ order: 1 }).lean()]);
  if (!doc) notFound();
  const product = toProductDetail(doc);
  return (
    <>
      <AdminHeader title={product.name} description={`/products/${product.slug}`} action={<Badge tone="outline">{doc.status}</Badge>} />
      <ProductForm categories={cats.map((c) => toCategory(c))} initial={{ ...product, categoryId: doc.category.toString(), status: doc.status, featured: doc.featured, pairsWith: (doc.pairsWith ?? []).map((p) => p.toString()) }} />
    </>
  );
}
