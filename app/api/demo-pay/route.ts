import { NextResponse } from 'next/server';
import { confirmPayment, getOrder, getPayment } from '@/lib/store';
import { paystackLive } from '@/lib/paystack';
import { emailOrderConfirmation } from '@/lib/email';
import { siteUrl } from '@/lib/site';

// Only works while no Paystack key is set, so it can never be used on the live shop.
export async function POST(req: Request) {
  if (paystackLive()) return NextResponse.json({ error: 'Demo payments are switched off.' }, { status: 403 });
  const { reference } = await req.json();
  const payment = await getPayment(String(reference));
  if (!payment) return NextResponse.json({ error: 'Payment not found.' }, { status: 404 });
  try {
    const { orderId, already } = await confirmPayment(payment.reference, payment.amount);
    const order = await getOrder(orderId);
    if (order && !already) await emailOrderConfirmation(order, await siteUrl());
    return NextResponse.json({ number: order?.number, email: order?.email });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Payment failed.' }, { status: 400 });
  }
}
