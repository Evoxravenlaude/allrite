import { NextResponse } from 'next/server';
import { confirmPayment, getOrder, getPayment } from '@/lib/store';
import { verifyPayment } from '@/lib/paystack';
import { emailOrderConfirmation } from '@/lib/email';
import { siteUrl } from '@/lib/site';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const base = await siteUrl();
  const reference = new URL(req.url).searchParams.get('reference') ?? new URL(req.url).searchParams.get('trxref');
  if (!reference) return NextResponse.redirect(`${base}/checkout?payment=missing`);
  const payment = await getPayment(reference);
  if (!payment) return NextResponse.redirect(`${base}/checkout?payment=missing`);
  try {
    const result = await verifyPayment(reference);
    if (!result.success) {
      const order = await getOrder(payment.order_id);
      return NextResponse.redirect(`${base}/order/${order?.number}?e=${encodeURIComponent(order?.email ?? '')}&payment=failed`);
    }
    const { orderId, already } = await confirmPayment(reference, result.amount);
    const order = await getOrder(orderId);
    if (order && !already) await emailOrderConfirmation(order, base);
    return NextResponse.redirect(`${base}/order/${order?.number}?e=${encodeURIComponent(order?.email ?? '')}&payment=success`);
  } catch (err) {
    console.error('Payment confirmation failed', err);
    const order = await getOrder(payment.order_id);
    return NextResponse.redirect(`${base}/order/${order?.number}?e=${encodeURIComponent(order?.email ?? '')}&payment=check`);
  }
}
