import Link from 'next/link';
import { requireStaff } from '@/lib/auth';
import { listOrders } from '@/lib/store';
import { CHANNEL_LABEL, dateTime, naira, PAYMENT_STATUS_LABEL, statusLabel } from '@/lib/format';

export const metadata = { title: 'Orders' };

const TABS = [
  ['received', 'To prepare'],
  ['open', 'In progress'],
  ['awaiting_payment', 'Waiting for payment'],
  ['deposit', 'Balance due'],
  ['', 'All orders'],
  ['cancelled', 'Cancelled'],
] as const;

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; channel?: string; q?: string }> }) {
  await requireStaff('manage_orders');
  const { status = 'received', channel, q } = await searchParams;
  const orders = await listOrders({ status: status || undefined, channel, search: q });
  const link = (s: string) => `/admin/orders?status=${s}${channel ? `&channel=${channel}` : ''}`;
  return (
    <div className="max-w-[1200px]">
      <h1 className="display text-[36px] leading-none">Orders</h1>
      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map(([s, label]) => (
          <Link key={s || 'all'} href={link(s)} className={`h-9 px-4 flex items-center text-[13px] border ${status === s ? 'bg-ink text-white border-ink' : 'border-stone hover:border-ink'}`}>
            {label}
          </Link>
        ))}
      </div>
      <form className="mt-4 flex flex-wrap gap-2">
        <input type="hidden" name="status" value={status} />
        <input name="q" defaultValue={q} placeholder="Order number, name, email or phone" className="field h-10 max-w-[340px]" />
        <select name="channel" defaultValue={channel ?? ''} className="field h-10 w-auto">
          <option value="">Online and in store</option>
          <option value="online">Online only</option>
          <option value="counter">Counter only</option>
          <option value="showroom">Showroom only</option>
        </select>
        <button className="btn-quiet btn-sm h-10">Search</button>
      </form>

      {orders.length === 0 ? (
        <p className="mt-10 text-[15px] text-ash">No orders here.</p>
      ) : (
        <div className="mt-6 bg-white border border-stone overflow-x-auto">
          <table className="w-full text-[14px] min-w-[760px]">
            <thead className="text-left text-ash text-[13px]">
              <tr className="border-b border-stone">
                <th className="font-normal px-4 py-3">Order</th>
                <th className="font-normal px-4 py-3">Customer</th>
                <th className="font-normal px-4 py-3">Placed</th>
                <th className="font-normal px-4 py-3">Status</th>
                <th className="font-normal px-4 py-3">Payment</th>
                <th className="font-normal px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-paper">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${o.id}`} className="underline underline-offset-4">{o.number}</Link>
                    <span className="block text-[12px] text-ash">{CHANNEL_LABEL[o.channel]}, {o.fulfilment === 'delivery' ? 'delivery' : o.fulfilment === 'collection' ? 'collection' : 'taken in store'}</span>
                  </td>
                  <td className="px-4 py-3">{o.customer_name || <span className="text-ash">Walk-in customer</span>}<span className="block text-[12px] text-ash">{o.phone}</span></td>
                  <td className="px-4 py-3 text-ash">{dateTime(o.created_at)}</td>
                  <td className="px-4 py-3">{statusLabel(o.status, o.fulfilment)}</td>
                  <td className="px-4 py-3">{PAYMENT_STATUS_LABEL[o.payment_status]}</td>
                  <td className="px-4 py-3 text-right">{naira(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
