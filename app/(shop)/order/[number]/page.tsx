import type { Metadata } from 'next';
import Link from 'next/link';
import { currentCustomer } from '@/lib/auth';
import { getOrderByNumber, getSettings, releaseExpiredOrders } from '@/lib/store';
import { dateTime, naira, orderSteps, statusLabel } from '@/lib/format';
import PayOrderButton from '@/components/shop/PayOrderButton';

export const metadata: Metadata = { title: 'Your order', robots: { index: false } };

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ number: string }>;
  searchParams: Promise<{ e?: string; payment?: string }>;
}) {
  const { number } = await params;
  const { e, payment } = await searchParams;
  await releaseExpiredOrders();
  const [order, customer, settings] = await Promise.all([getOrderByNumber(decodeURIComponent(number)), currentCustomer(), getSettings()]);
  const allowed =
    order && ((e && order.email.toLowerCase() === e.trim().toLowerCase()) || (customer && order.customer_id === customer.id));

  if (!order || !allowed) {
    return (
      <div className="page-x mx-auto max-w-[560px] pt-14">
        <h1 className="display text-[36px] leading-tight">We could not find that order.</h1>
        <p className="mt-4 text-ash">Check the order number and email address, then try again.</p>
        <Link href="/order" className="btn-quiet mt-8">Search again</Link>
      </div>
    );
  }

  const steps = orderSteps(order.fulfilment);
  const current = steps.indexOf(order.status);
  const balance = order.total - order.amount_paid;

  return (
    <div className="page-x mx-auto max-w-[880px] pt-10 sm:pt-14">
      {payment === 'success' && (
        <div className="mb-10 p-5 bg-white border border-stone" role="status">
          <p className="display text-[26px]">Thank you. Your payment went through.</p>
          <p className="mt-1 text-ash text-[14px]">A confirmation is on its way to {order.email}. Keep this page to follow your order.</p>
        </div>
      )}
      {payment === 'failed' && (
        <p className="mb-8 p-4 border border-alert text-alert text-[14px]" role="alert">
          The payment did not go through and no money was taken. Try again below, or use a different card or bank.
        </p>
      )}
      {payment === 'check' && (
        <p className="mb-8 p-4 border border-stone text-[14px]" role="status">
          We are still confirming your payment with Paystack. Refresh this page in a minute.
        </p>
      )}

      <p className="text-[13px] text-ash">Order {order.number}, placed {dateTime(order.created_at)}</p>
      <h1 className="display text-[40px] sm:text-[48px] leading-none mt-2">{statusLabel(order.status, order.fulfilment)}</h1>

      {order.status === 'awaiting_payment' && (
        <div className="mt-6 max-w-[48ch]">
          <p className="text-[15px]">This order is waiting for payment. Your pieces are held until {dateTime(order.expires_at)}.</p>
          <PayOrderButton number={order.number} email={order.email} label="Complete payment" />
        </div>
      )}
      {order.status === 'cancelled' && <p className="mt-4 text-[15px] text-ash max-w-[56ch]">This order was cancelled. {order.payment_status === 'unpaid' ? 'No payment was taken.' : 'Our team will contact you about your refund.'}</p>}

      {order.status !== 'cancelled' && order.status !== 'awaiting_payment' && (
        <ol className="mt-10 grid grid-cols-4 gap-2 text-[13px]" aria-label="Order progress">
          {steps.map((s, i) => (
            <li key={s} className="flex flex-col gap-2" aria-current={i === current ? 'step' : undefined}>
              <span className={`h-[3px] ${i <= current ? 'bg-ink' : 'bg-stone'}`} />
              <span className={i <= current ? 'text-ink' : 'text-ash'}>{statusLabel(s, order.fulfilment)}</span>
            </li>
          ))}
        </ol>
      )}

      {balance > 0 && order.payment_status === 'deposit_paid' && order.status !== 'cancelled' && (
        <div className="mt-10 p-5 bg-white border border-stone">
          <p className="text-[15px]">Deposit received. A balance of {naira(balance)} is due before delivery.</p>
          <PayOrderButton number={order.number} email={order.email} label={`Pay the balance of ${naira(balance)}`} />
        </div>
      )}

      <div className="mt-12 grid gap-10 md:grid-cols-2">
        <section>
          <h2 className="text-[17px] mb-4">Items</h2>
          <ul className="divide-y divide-stone text-[14px] border-t border-stone">
            {order.items.map((i) => (
              <li key={i.id} className="py-3 flex justify-between gap-4">
                <span>
                  {i.name}
                  <span className="block text-ash">{[i.size, i.colour].filter(Boolean).join(', ')} × {i.qty}</span>
                </span>
                <span>{naira(i.price * i.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 text-[14px] space-y-1.5">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{naira(order.subtotal)}</dd></div>
            {order.fulfilment === 'delivery' && <div className="flex justify-between"><dt>Delivery</dt><dd>{naira(order.delivery_fee)}</dd></div>}
            {order.discount > 0 && <div className="flex justify-between"><dt>Discount</dt><dd>−{naira(order.discount)}</dd></div>}
            <div className="flex justify-between text-[16px] pt-1"><dt>Total</dt><dd>{naira(order.total)}</dd></div>
            <div className="flex justify-between text-ash"><dt>Paid</dt><dd>{naira(order.amount_paid)}</dd></div>
          </dl>
        </section>
        <section className="text-[14px] space-y-6">
          <div>
            <h2 className="text-[17px] mb-2">{order.fulfilment === 'collection' ? 'Collection' : 'Delivery'}</h2>
            {order.fulfilment === 'collection' ? (
              <p>{settings.address}, {settings.city}<br /><span className="text-ash">{settings.hours}</span></p>
            ) : (
              <p className="whitespace-pre-line">{order.address}<br /><span className="text-ash">{order.zone_name}</span></p>
            )}
          </div>
          {order.is_gift && (
            <div>
              <h2 className="text-[17px] mb-2">Gift message</h2>
              <p className="whitespace-pre-line">{order.gift_message || 'No message. Prices are left off the packing slip.'}</p>
            </div>
          )}
          <div>
            <h2 className="text-[17px] mb-2">Questions</h2>
            <a className="link" target="_blank" rel="noreferrer" href={`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(`Hello Allrite, I have a question about order ${order.number}.`)}`}>
              Message us on WhatsApp about this order
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
