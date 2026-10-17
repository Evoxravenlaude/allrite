import Link from 'next/link';
import { notFound } from 'next/navigation';
import { can, requireStaff } from '@/lib/auth';
import { getProductById, listCategories, nextBarcode } from '@/lib/store';
import ProductForm from '@/components/admin/ProductForm';
import { naira } from '@/lib/format';

export const metadata = { title: 'Edit product' };

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff();
  const product = await getProductById((await params).id);
  if (!product) notFound();
  if (!can(staff.role, 'edit_products')) {
    return (
      <div className="max-w-[800px]">
        <Link href="/admin/products" className="text-[13px] text-ash hover:underline">All products</Link>
        <h1 className="display text-[36px] leading-none mt-2">{product.name}</h1>
        <p className="mt-2">{naira(product.price)}</p>
        <ul className="mt-6 bg-white border border-stone divide-y divide-stone text-[14px]">
          {product.variants.map((v) => (
            <li key={v.id} className="px-4 py-3 flex justify-between"><span>{[v.size, v.colour].filter(Boolean).join(', ')} <span className="text-ash">{v.barcode}</span></span><span>{v.stock} in stock</span></li>
          ))}
        </ul>
        <p className="mt-4 text-[13px] text-ash">Only a manager or the owner can change products and prices.</p>
      </div>
    );
  }
  const [categories, barcode] = await Promise.all([listCategories(), nextBarcode()]);
  return (
    <div className="max-w-[1000px]">
      <Link href="/admin/products" className="text-[13px] text-ash hover:underline">All products</Link>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <h1 className="display text-[36px] leading-none">{product.name}</h1>
        <div className="flex gap-4 text-[13px]">
          <a href={`/admin/products/${product.id}/labels`} target="_blank" className="link">Print barcode labels</a>
          <a href={`/product/${product.slug}`} target="_blank" className="link">View in the shop</a>
        </div>
      </div>
      <ProductForm product={product} categories={categories} firstBarcode={barcode} />
    </div>
  );
}
