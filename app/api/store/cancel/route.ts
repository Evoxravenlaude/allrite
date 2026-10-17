import { z } from 'zod';
import { staffRoute } from '@/lib/api';
import { cancelOrder, getOrder } from '@/lib/store';

export const POST = staffRoute('sell', async (staff, req) => {
  const { orderId } = z.object({ orderId: z.string().uuid() }).parse(await req.json());
  const order = await getOrder(orderId);
  if (!order) throw new Error('Order not found.');
  if (order.payment_status !== 'unpaid') throw new Error('This order has been paid. Ask a manager to cancel it from the dashboard.');
  await cancelOrder(orderId, staff.id);
  return { ok: true };
});
