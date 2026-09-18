import Link from "next/link";
import { Plus } from "lucide-react";
import { listQuerySchema } from "@/lib/validation/commerce";
import { listProducts } from "@/lib/commerce/product-query";
import { formatPrice } from "@/lib/client/format";
import { AdminHeader, Table, Th, Td } from "@/components/admin/ui";
import { ProductImage } from "@/components/commerce/product-image";
import { Badge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/commerce/pagination";
import { AdminSearch } from "@/components/admin/search";

export default async function AdminProducts({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const raw = await searchParams;
  const parsed = listQuerySchema.safeParse(raw);
  const q = parsed.success ? parsed.data : listQuerySchema.parse({});
  const { products, pagination } = await listProducts({ ...q, status: q.status ?? "all", pageSize: 24, sort: q.sort ?? "newest" }, { includeInactive: true });
  return (
    <>
      <AdminHeader title="Products" description={`${pagination.total} in catalogue`} action={<Button href="/admin/products/new" size="sm"><Plus className="h-3.5 w-3.5" /> Add product</Button>} />
      <AdminSearch placeholder="Search products" statuses={["all", "active", "draft", "archived"]} />
      <Table className="mt-4">
        <thead><tr><Th>Product</Th><Th>Category</Th><Th>Price</Th><Th>Stock</Th><Th>Status</Th><Th /></tr></thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="hover:bg-white/[0.02]">
              <Td>
                <div className="flex items-center gap-3">
                  <ProductImage src={p.image?.url} alt="" sizes="40px" fallbackHex={p.colors[0]?.hex} className="h-12 w-10 rounded-[4px]" />
                  <div className="min-w-0">
                    <Link href={`/admin/products/${p.id}`} className="block truncate text-fg hover:underline">{p.name}</Link>
                    <p className="meta font-mono">{p.slug}</p>
                  </div>
                </div>
              </Td>
              <Td className="capitalize">{p.categorySlug.replace(/-/g, " ")}</Td>
              <Td className="tabular">{formatPrice(p.price)}</Td>
              <Td>{p.inStock ? <span className="text-fg-soft">In stock</span> : <span className="text-danger">Sold out</span>}</Td>
              <Td>{(p as unknown as { status?: string }).status ? <Badge tone="outline">{(p as unknown as { status?: string }).status}</Badge> : <Badge tone="outline">active</Badge>}</Td>
              <Td className="text-right"><Link href={`/products/${p.slug}`} className="text-[12px] text-fg-muted hover:text-fg" target="_blank">View ↗</Link></Td>
            </tr>
          ))}
          {products.length === 0 && (
            <tr><Td className="py-10 text-center text-fg-muted">No products match.</Td><Td /><Td /><Td /><Td /><Td /></tr>
          )}
        </tbody>
      </Table>
      <Pagination pagination={pagination} basePath="/admin/products" params={raw} className="mt-8" />
    </>
  );
}
