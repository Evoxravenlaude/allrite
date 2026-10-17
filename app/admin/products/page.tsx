import Link from 'next/link';
import { can, requireStaff } from '@/lib/auth';
import { listProducts } from '@/lib/store';
import { naira } from '@/lib/format';

export const metadata = { title: 'Products' };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ q?: string; dept?: string }> }) {
  const staff = await requireStaff();
  const { q, dept } = await searchParams;
  const products = await listProducts({
    includeUnpublished: true,
    search: q,
    department: dept === 'fashion' || dept === 'furniture' ? dept : undefined,
    sort: 'name',
  });
  const editable = can(staff.role, 'edit_products');
  return (
    <div className="max-w-[1200px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="display text-[36px] leading-none">Products</h1>
        {editable && <Link href="/admin/products/new" className="btn btn-sm">Add a product</Link>}
      </div>
      <form className="mt-6 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Search by name or material" className="field h-10 max-w-[320px]" />
        <select name="dept" defaultValue={dept ?? ''} className="field h-10 w-auto">
          <option value="">Fashion and furniture</option>
          <option value="fashion">Fashion</option>
          <option value="furniture">Furniture</option>
        </select>
        <button className="btn-quiet btn-sm h-10">Search</button>
      </form>
      <p className="mt-4 text-[13px] text-ash">{products.length} products</p>
      <ul className="mt-3 bg-white border border-stone divide-y divide-stone">
        {products.map((p) => {
          const total = p.variants.reduce((s, v) => s + v.stock, 0);
          return (
            <li key={p.id}>
              <Link href={`/admin/products/${p.id}`} className="px-4 py-3 flex items-center gap-4 hover:bg-paper text-[14px]">
                <div className="w-12 aspect-[4/5] bg-mist shrink-0">{p.images[0] && <img src={p.images[0].url} alt="" className="w-full h-full object-cover" />}</div>
                <div className="flex-1 min-w-0">
                  <p className="truncate">{p.name}{!p.published && <span className="ml-2 text-[12px] text-ash">Hidden from shop</span>}</p>
                  <p className="text-[13px] text-ash">{p.department === 'fashion' ? 'Fashion' : 'Furniture'}, {p.category}</p>
                </div>
                <p className="w-32 text-right hidden sm:block">{naira(p.price)}</p>
                <p className={`w-28 text-right ${p.availability !== 'made_to_order' && total === 0 ? 'text-alert' : 'text-ash'}`}>
                  {p.availability === 'made_to_order' ? 'Made to order' : `${total} in stock`}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
