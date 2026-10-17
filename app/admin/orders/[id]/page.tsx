import Link from 'next/link';
import { notFound } from 'next/navigation';
import { can, requireStaff } from '@/lib/auth';
import { getOrder, getSettings } from '@/lib/store';
import { CHANNEL_LABEL, dateTime, naira, PAYMENT_PHRASE, PAYMENT_STATUS_LABEL, statusLabel } from '@/lib/format';
import { siteUrl } from '@/lib/site';
import OrderActions from '@/components/admin/OrderActions';

export const metadata = { title: 'Order' };

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff('manage_orders');
  const order = await getOrder((await params).id);
  if (!order) notFound();
  const settings = await getSettings();
  const balance = order.total - order.amount_paid;
  const payLink = `${await siteUrl()}/order/${order.number}?e=${encodeURIComponent(order.email)}`;

  return (
    <div className="max-w-[1100px]">
      <Link href="/admin/orders" className="text-[13px] text-ash hover:underline">All orders</Link>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display text-[36px] leading-none">{order.number}</h1>
          <p className="mt-2 text-[14px] text-ash">
            {CHANNEL_LABEL[order.channel]} order placed {dateTime(order.created_at)}{order.staff_name ? ` by ${order.staff_name}` : ''}
          </p>
        </div>
        <a href={`/admin/orders/${order.id}/slip`} target="_blank" className="btn-quiet btn-sm">Print packing slip</a>
      </div>

      {order.note && order.note.includes('PAID AFTER') && (
        <p className="mt-6 p-4 border border-alert text-alert text-[14px]">{order.note}</p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-8">
          <section className="bg-white border border-stone">
            <ul className="divide-y divide-stone text-[14px]">
              {order.items.map((i) => (
                <li key={i.id} className="px-5 py-3 flex justify-between gap-4">
                  <span>{i.name}<span className="block text-ash">{[i.size, i.colour].filter(Boolean).join(', ')} × {i.qty}</span></span>
                  <span>{naira(i.price * i.qty)}</span>
                </li>
              ))}
            </ul>
            <dl className="border-t border-stone px-5 py-4 text-[14px] space-y-1.5">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{naira(order.subtotal)}</dd></div>
              {order.fulfilment === 'delivery' && <div className="flex justify-between"><dt>Delivery, {order.zone_name}</dt><dd>{naira(order.delivery_fee)}</dd></div>}
              {order.discount > 0 && <div className="flex justify-between"><dt>Discount</dt><dd>−{naira(order.discount)}</dd></div>}
              <div className="flex justify-between text-[16px]"><dt>Total</dt><dd>{naira(order.total)}</dd></div>
              <div className="flex justify-between text-ash"><dt>Paid{order.payment_method ? ` by ${PAYMENT_PHRASE[order.payment_method]}` : ''}</dt><dd>{naira(order.amount_paid)}</dd></div>
              {balance > 0 && order.status !== 'cancelled' && <div className="flex justify-between"><dt>Balance due</dt><dd>{naira(balance)}</dd></div>}
            </dl>
          </section>
          <section className="grid gap-6 sm:grid-cols-2 text-[14px]">
            <div>
              <h2 className="text-ash text-[13px] mb-1">Customer</h2>
              <p>{order.customer_name || 'Walk-in customer'}</p>
              {order.phone && <p><a className="link" href={`tel:${order.phone}`}>{order.phone}</a> <a className="link ml-2" target="_blank" rel="noreferrer" href={`https://wa.me/${order.phone.replace(/\D/g, '').replace(/^0/, '234')}`}>WhatsApp</a></p>}
              {order.email && <p><a className="link" href={`mailto:${order.email}`}>{order.email}</a></p>}
            </div>
            <div>
              <h2 className="text-ash text-[13px] mb-1">{order.fulfilment === 'delivery' ? 'Deliver to' : 'Fulfilment'}</h2>
              {order.fulfilment === 'delivery' ? <p className="whitespace-pre-line">{order.address}<br />{order.zone_name}</p> : order.fulfilment === 'collection' ? <p>Customer collects from {settings.address}</p> : <p>Taken from the store at the time of sale</p>}
            </div>
            {order.is_gift && (
              <div className="sm:col-span-2">
                <h2 className="text-ash text-[13px] mb-1">Gift order: leave prices off the slip</h2>
                <p className="whitespace-pre-line">{order.gift_message || 'No message.'}</p>
              </div>
            )}
          </section>
        </div>
        <OrderActions
          order={{ id: order.id, status: order.status, fulfilment: order.fulfilment, channel: order.channel, payment_status: order.payment_status, email: order.email, note: order.note, balance }}
          statusText={statusLabel(order.status, order.fulfilment)}
          paymentText={PAYMENT_STATUS_LABEL[order.payment_status]}
          canCancel={can(staff.role, 'edit_stock')}
          payLink={payLink}
        />
      </div>
    </div>
  );
}
