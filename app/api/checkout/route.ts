import { NextResponse } from 'next/server';
import { z } from 'zod';
import { currentCustomer } from '@/lib/auth';
import { StockError, createOnlineOrder, createPayment } from '@/lib/store';
import { initializePayment, paystackLive } from '@/lib/paystack';
import { siteUrl } from '@/lib/site';

const schema = z
  .object({
    lines: z.array(z.object({ variantId: z.string().uuid(), qty: z.number().int().min(1).max(20) })).min(1, 'Your bag is empty.'),
    name: z.string().trim().min(2, 'Enter your full name.'),
    email: z.string().trim().email('Enter a valid email address.'),
    phone: z.string().trim().min(7, 'Enter a phone number for delivery updates.'),
    fulfilment: z.enum(['delivery', 'collection']),
    zoneId: z.string().uuid().nullable().optional(),
    address: z.string().trim().max(500).optional().default(''),
    isGift: z.boolean().optional().default(false),
    giftMessage: z.string().trim().max(300).optional().default(''),
    payDeposit: z.boolean().optional().default(false),
  })
  .refine((v) => v.fulfilment === 'collection' || (v.zoneId && v.address.length >= 6), {
    message: 'Enter a delivery address and choose a delivery area.',
  });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const v = parsed.data;
  const customer = await currentCustomer();
  try {
    const order = await createOnlineOrder({
      lines: v.lines,
      customer: { name: v.name, email: v.email, phone: v.phone, customerId: customer?.id ?? null },
      fulfilment: v.fulfilment,
      zoneId: v.fulfilment === 'delivery' ? v.zoneId ?? null : null,
      address: v.fulfilment === 'delivery' ? v.address : '',
      isGift: v.isGift,
      giftMessage: v.isGift ? v.giftMessage : '',
      payDeposit: v.payDeposit,
    });
    const reference = await createPayment(order.id, 'initial', order.totals.dueNow);
    const base = await siteUrl();
    if (!paystackLive()) {
      return NextResponse.json({ url: `/checkout/demo-pay?reference=${reference}`, number: order.number });
    }
    const init = await initializePayment({
      email: v.email,
      amount: order.totals.dueNow,
      reference,
      callbackUrl: `${base}/api/paystack/callback`,
      metadata: { order_number: order.number, custom_fields: [{ display_name: 'Order', variable_name: 'order', value: order.number }] },
    });
    return NextResponse.json({ url: init.authorization_url, number: order.number });
  } catch (err) {
    if (err instanceof StockError) return NextResponse.json({ error: err.message }, { status: 409 });
    console.error(err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Checkout failed. Try again.' }, { status: 500 });
  }
}
