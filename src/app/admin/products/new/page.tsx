import { connectDB } from "@/lib/db";
import { Category } from "@/lib/models/Category";
import { toCategory } from "@/lib/commerce/serialize";
import { AdminHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";

export default async function NewProductPage() {
  await connectDB();
  const cats = (await Category.find().sort({ order: 1 }).lean()).map((c) => toCategory(c));
  return (
    <>
      <AdminHeader title="New product" description="Variants are generated from colours × sizes; set stock per cell." />
      <ProductForm categories={cats} />
    </>
  );
}
