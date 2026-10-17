import { NextResponse } from 'next/server';
import { createPayment, getOrderByNumber, releaseExpiredOrders } from '@/lib/store';
import { q } from '@/lib/db';
import { initializePayment, paystackLive } from '@/lib/paystack';
import { siteUrl } from '@/lib/site';

/** Starts a payment for an existing order: a retry of an unfinished checkout, or the balance on a furniture deposit. */
export async function POST(req: Request) {
  const { number, email } = await req.json();
  await releaseExpiredOrders();
  const order = await getOrderByNumber(String(number ?? ''));
  if (!order || order.email.toLowerCase() !== String(email ?? '').trim().toLowerCase()) {
    return NextResponse.json({ error: 'We could not find that order.' }, { status: 404 });
  }
  if (order.status === 'cancelled') return NextResponse.json({ error: 'This order was cancelled. Place a new order from your bag.' }, { status: 400 });
  let kind: 'initial' | 'balance';
  let amount: number;
  if (order.payment_status === 'unpaid') {
    const [last] = await q(`select amount from payments where order_id = $1 and kind = 'initial' order by created_at desc limit 1`, [order.id]);
    kind = 'initial';
    amount = last?.amount ?? order.total;
  } else if (order.payment_status === 'deposit_paid') {
    kind = 'balance';
    amount = order.total - order.amount_paid;
  } else {
    return NextResponse.json({ error: 'This order is already paid in full.' }, { status: 400 });
  }
  const reference = await createPayment(order.id, kind, amount);
  if (!paystackLive()) return NextResponse.json({ url: `/checkout/demo-pay?reference=${reference}` });
  const init = await initializePayment({
    email: order.email,
    amount,
    reference,
    callbackUrl: `${await siteUrl()}/api/paystack/callback`,
    metadata: { order_number: order.number, kind },
  });
  return NextResponse.json({ url: init.authorization_url });
}
