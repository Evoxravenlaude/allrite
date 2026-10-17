import { requireStaff } from '@/lib/auth';
import { listCategories, nextBarcode } from '@/lib/store';
import ProductForm from '@/components/admin/ProductForm';

export const metadata = { title: 'Add a product' };

export default async function NewProduct() {
  await requireStaff('edit_products');
  const [categories, barcode] = await Promise.all([listCategories(), nextBarcode()]);
  return (
    <div className="max-w-[1000px]">
      <h1 className="display text-[36px] leading-none">Add a product</h1>
      <ProductForm categories={categories} firstBarcode={barcode} />
    </div>
  );
}
