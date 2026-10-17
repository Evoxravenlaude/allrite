import { notFound } from 'next/navigation';
import { requireStaff } from '@/lib/auth';
import { getOrder, getSettings } from '@/lib/store';
import { dateOnly, naira } from '@/lib/format';
import AutoPrint from '@/components/store/AutoPrint';

export const metadata = { title: 'Packing slip' };

export default async function Slip({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff('manage_orders');
  const order = await getOrder((await params).id);
  if (!order) notFound();
  const s = await getSettings();
  const prices = !order.is_gift;
  return (
    <div className="fixed inset-0 z-50 bg-white overflow-auto">
      <AutoPrint />
      <div className="max-w-[640px] mx-auto p-10 text-[14px]">
        <div className="flex justify-between items-start">
          <p className="font-display tracking-[0.28em] text-[24px]">ALLRITE</p>
          <div className="text-right"><p>{order.number}</p><p className="text-ash">{dateOnly(order.created_at)}</p></div>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-6">
          <div>
            <p className="text-ash text-[12px]">{order.fulfilment === 'delivery' ? 'Deliver to' : 'For collection by'}</p>
            <p>{order.customer_name}</p>
            <p>{order.phone}</p>
            {order.fulfilment === 'delivery' && <p className="whitespace-pre-line">{order.address}<br />{order.zone_name}</p>}
          </div>
          <div>
            <p className="text-ash text-[12px]">From</p>
            <p>{s.storeName}</p>
            <p>{s.address}, {s.city}</p>
            <p>{s.phone}</p>
          </div>
        </div>
        <table className="mt-10 w-full">
          <thead><tr className="text-left text-ash text-[12px] border-b border-black"><th className="font-normal py-2">Item</th><th className="font-normal">Qty</th>{prices && <th className="font-normal text-right">Price</th>}</tr></thead>
          <tbody>
            {order.items.map((i) => (
              <tr key={i.id} className="border-b border-stone">
                <td className="py-2">{i.name}<span className="block text-ash">{[i.size, i.colour].filter(Boolean).join(', ')}</span></td>
                <td>{i.qty}</td>
                {prices && <td className="text-right">{naira(i.price * i.qty)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
        {prices && <p className="mt-4 text-right">Total {naira(order.total)}, paid {naira(order.amount_paid)}</p>}
        {order.is_gift && order.gift_message && (
          <div className="mt-14 p-8 border border-stone">
            <p className="font-display text-[20px] leading-relaxed whitespace-pre-line">{order.gift_message}</p>
          </div>
        )}
        <p className="mt-14 text-[12px] text-ash">{s.receiptFooter}</p>
      </div>
    </div>
  );
}
