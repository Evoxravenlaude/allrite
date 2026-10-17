import { notFound } from 'next/navigation';
import { requireStaff } from '@/lib/auth';
import { getOrder, getSettings } from '@/lib/store';
import { dateTime, naira, PAYMENT_PHRASE } from '@/lib/format';
import AutoPrint from '@/components/store/AutoPrint';

export const metadata = { title: 'Receipt' };

export default async function Receipt({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ print?: string }> }) {
  await requireStaff('sell');
  const [{ id }, { print }] = await Promise.all([params, searchParams]);
  const [order, s] = await Promise.all([getOrder(id), getSettings()]);
  if (!order) notFound();
  return (
    <div className="bg-white min-h-svh py-6 print:py-0">
      <style>{`@page { size: 80mm auto; margin: 4mm; } @media print { body { background: #fff; } }`}</style>
      {print && <AutoPrint />}
      <div className="mx-auto w-[72mm] text-[12px] leading-snug text-black font-sans">
        <p className="font-display tracking-[0.28em] text-[20px] text-center">ALLRITE</p>
        <p className="text-center mt-1">{s.storeName}</p>
        <p className="text-center">{s.address}, {s.city}</p>
        <p className="text-center">{s.phone}</p>
        <div className="border-t border-dashed border-black my-3" />
        <p>Receipt {order.number}</p>
        <p>{dateTime(order.paid_at ?? order.created_at)}</p>
        {order.staff_name && <p>Served by {order.staff_name}</p>}
        {order.customer_name && <p>Customer: {order.customer_name}</p>}
        <div className="border-t border-dashed border-black my-3" />
        <table className="w-full">
          <tbody>
            {order.items.map((i) => (
              <tr key={i.id} className="align-top">
                <td className="pb-1.5 pr-2">
                  {i.name}
                  {(i.size || i.colour) && <span className="block">{[i.size, i.colour].filter(Boolean).join(', ')}</span>}
                  {i.qty > 1 && <span className="block">{i.qty} × {naira(i.price)}</span>}
                </td>
                <td className="pb-1.5 text-right whitespace-nowrap">{naira(i.price * i.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-dashed border-black my-3" />
        <div className="flex justify-between"><span>Subtotal</span><span>{naira(order.subtotal)}</span></div>
        {order.delivery_fee > 0 && <div className="flex justify-between"><span>Delivery</span><span>{naira(order.delivery_fee)}</span></div>}
        {order.discount > 0 && <div className="flex justify-between"><span>Discount</span><span>−{naira(order.discount)}</span></div>}
        <div className="flex justify-between text-[15px] mt-1 font-semibold"><span>Total</span><span>{naira(order.total)}</span></div>
        <div className="flex justify-between mt-1"><span>Paid by {PAYMENT_PHRASE[order.payment_method ?? 'cash']}</span><span>{naira(order.amount_paid)}</span></div>
        {order.total - order.amount_paid > 0 && <div className="flex justify-between"><span>Balance due</span><span>{naira(order.total - order.amount_paid)}</span></div>}
        <div className="border-t border-dashed border-black my-3" />
        <p className="text-center">{s.receiptFooter}</p>
        <p className="text-center mt-2">WhatsApp +{s.whatsapp}</p>
      </div>
    </div>
  );
}
