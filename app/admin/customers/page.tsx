import Link from 'next/link';
import { requireStaff } from '@/lib/auth';
import { listCustomers } from '@/lib/store';
import { dateOnly, naira } from '@/lib/format';

export const metadata = { title: 'Customers' };

export default async function Customers({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireStaff('view_customers');
  const { q } = await searchParams;
  const customers = await listCustomers(q);
  return (
    <div className="max-w-[1200px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="display text-[36px] leading-none">Customers</h1>
        <a href="/admin/export/customers" className="link text-[13px]">Download customers as a spreadsheet</a>
      </div>
      <form className="mt-6"><input name="q" defaultValue={q} placeholder="Name, email or phone" className="field h-10 max-w-[320px]" /></form>
      <div className="mt-4 bg-white border border-stone overflow-x-auto">
        <table className="w-full min-w-[720px] text-[14px]">
          <thead className="text-left text-ash text-[13px]">
            <tr className="border-b border-stone">
              <th className="font-normal px-4 py-3">Customer</th>
              <th className="font-normal px-4 py-3">Phone</th>
              <th className="font-normal px-4 py-3 text-right">Paid orders</th>
              <th className="font-normal px-4 py-3 text-right">Total spent</th>
              <th className="font-normal px-4 py-3">Last order</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone">
            {customers.map((c) => (
              <tr key={c.id as string} className="hover:bg-paper">
                <td className="px-4 py-3">
                  <Link href={`/admin/customers/${c.id}`} className="underline underline-offset-4">{(c.name as string) || (c.email as string)}</Link>
                  <span className="block text-[12px] text-ash">{c.email as string}{c.has_account ? ', has an account' : ''}</span>
                </td>
                <td className="px-4 py-3">{c.phone as string}</td>
                <td className="px-4 py-3 text-right">{c.orders as number}</td>
                <td className="px-4 py-3 text-right">{naira(c.spent as number)}</td>
                <td className="px-4 py-3 text-ash">{dateOnly(c.last_order as string)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {customers.length === 0 && <p className="p-6 text-ash text-[14px]">No customers yet. Everyone who orders online, books a viewing or leaves details at the counter appears here.</p>}
      </div>
    </div>
  );
}
