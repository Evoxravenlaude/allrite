import { requireStaff } from '@/lib/auth';
import { allStock } from '@/lib/store';
import StockTable from '@/components/admin/StockTable';

export const metadata = { title: 'Stock' };

export default async function StockPage({ searchParams }: { searchParams: Promise<{ low?: string }> }) {
  await requireStaff('edit_stock');
  const { low } = await searchParams;
  const rows = await allStock();
  return (
    <div className="max-w-[1200px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="display text-[36px] leading-none">Stock</h1>
        <a href="/admin/export/stock" className="link text-[13px]">Download stock as a spreadsheet</a>
      </div>
      <p className="mt-3 text-[14px] text-ash max-w-[70ch]">
        Use “Add” when a delivery arrives. Use “Set count” after a stock take. Every change is recorded with your name and shows on the
        website and both store screens within seconds.
      </p>
      <StockTable rows={rows as never} lowOnly={low === '1'} />
    </div>
  );
}
