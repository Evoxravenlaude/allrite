import { z } from 'zod';
import { staffRoute } from '@/lib/api';
import { can } from '@/lib/auth';
import { createCounterSale, getOrder } from '@/lib/store';
import { emailReceipt } from '@/lib/email';

const schema = z.object({
  lines: z.array(z.object({ variantId: z.string().uuid(), qty: z.number().int().min(1).max(50) })).min(1, 'Scan at least one item.'),
  method: z.enum(['cash', 'transfer', 'pos_card']),
  discount: z.number().int().min(0).default(0),
  customer: z.object({ name: z.string().default(''), email: z.string().default(''), phone: z.string().default('') }),
});

export const POST = staffRoute('sell', async (staff, req) => {
  const v = schema.parse(await req.json());
  if (v.discount > 0 && !can(staff.role, 'discount')) throw new Error('Only a manager or the owner can give a discount.');
  const sale = await createCounterSale({ lines: v.lines, method: v.method, discount: v.discount, staffId: staff.id, customer: v.customer });
  const order = await getOrder(sale.id);
  if (order?.email) await emailReceipt(order);
  return order;
});
