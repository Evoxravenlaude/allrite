import { z } from 'zod';
import { staffRoute } from '@/lib/api';
import { createShowroomOrder } from '@/lib/store';

const schema = z.object({
  lines: z.array(z.object({ variantId: z.string().uuid(), qty: z.number().int().min(1).max(50) })).min(1, 'Add at least one piece.'),
  customer: z.object({
    name: z.string().trim().min(2, "Enter the customer's name."),
    email: z.string().trim().default(''),
    phone: z.string().trim().min(7, "Enter the customer's phone number."),
  }),
  fulfilment: z.enum(['in_store', 'delivery', 'collection']),
  zoneId: z.string().uuid().nullable().default(null),
  address: z.string().default(''),
  note: z.string().default(''),
});

export const POST = staffRoute('sell', async (staff, req) => {
  const v = schema.parse(await req.json());
  return createShowroomOrder({ ...v, staffId: staff.id });
});
