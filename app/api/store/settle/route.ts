import { z } from 'zod';
import { staffRoute } from '@/lib/api';
import { getOrder, settleAtCounter } from '@/lib/store';
import { emailReceipt } from '@/lib/email';

const schema = z.object({ orderId: z.string().uuid(), method: z.enum(['cash', 'transfer', 'pos_card']) });

export const POST = staffRoute('sell', async (staff, req) => {
  const v = schema.parse(await req.json());
  await settleAtCounter(v.orderId, v.method, staff.id);
  const order = await getOrder(v.orderId);
  if (order?.email) await emailReceipt(order);
  return order;
});
