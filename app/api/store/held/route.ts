import { staffRoute } from '@/lib/api';
import { getOrderByNumber, heldShowroomOrders } from '@/lib/store';

export const dynamic = 'force-dynamic';

export const GET = staffRoute('sell', async (_staff, req) => {
  const number = new URL(req.url).searchParams.get('number');
  if (number) {
    const order = await getOrderByNumber(number);
    if (!order) throw new Error(`No order has the number ${number.toUpperCase()}.`);
    return [order];
  }
  return heldShowroomOrders();
});
