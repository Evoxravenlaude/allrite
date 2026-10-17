import { NextResponse } from 'next/server';
import { confirmPayment, getOrder, getPayment } from '@/lib/store';
import { validWebhookSignature } from '@/lib/paystack';
import { emailOrderConfirmation } from '@/lib/email';
import { siteUrl } from '@/lib/site';

// Paystack calls this address after every payment, even if the customer closes their browser.
// Set it in the Paystack dashboard under Settings, API Keys and Webhooks: https://YOUR-DOMAIN/api/paystack/webhook
export async function POST(req: Request) {
  const raw = await req.text();
  if (!validWebhookSignature(raw, req.headers.get('x-paystack-signature'))) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }
  const event = JSON.parse(raw);
  if (event.event === 'charge.success') {
    const reference = event.data?.reference as string;
    const payment = reference ? await getPayment(reference) : null;
    if (payment) {
      try {
        const { orderId, already } = await confirmPayment(reference, Math.round(event.data.amount / 100));
        const order = await getOrder(orderId);
        if (order && !already) await emailOrderConfirmation(order, await siteUrl());
      } catch (err) {
        console.error('Webhook confirmation failed', err);
      }
    }
  }
  return NextResponse.json({ received: true });
}
