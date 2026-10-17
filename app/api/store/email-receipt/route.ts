import { z } from 'zod';
import { staffRoute } from '@/lib/api';
import { getOrder } from '@/lib/store';
import { q } from '@/lib/db';
import { emailReceipt } from '@/lib/email';

export const POST = staffRoute('sell', async (_staff, req) => {
  const { orderId, email } = z.object({ orderId: z.string().uuid(), email: z.string().email('Enter a valid email address.') }).parse(await req.json());
  await q(`update orders set email = $2 where id = $1 and email = ''`, [orderId, email.toLowerCase()]);
  const order = await getOrder(orderId);
  if (!order) throw new Error('Order not found.');
  await emailReceipt({ ...order, email });
  return { ok: true };
});
