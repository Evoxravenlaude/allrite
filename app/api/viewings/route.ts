import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createViewing } from '@/lib/store';
import { emailNewViewing } from '@/lib/email';
import { dateTime } from '@/lib/format';

const schema = z.object({
  productId: z.string().uuid(),
  name: z.string().trim().min(2, 'Enter your name.'),
  phone: z.string().trim().min(7, 'Enter a phone number we can reach you on.'),
  email: z.string().trim().email().or(z.literal('')).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a date.'),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  note: z.string().max(1000).optional(),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  const v = parsed.data;
  const preferredAt = `${v.date}T${v.time}:00+01:00`;
  if (new Date(preferredAt).getTime() < Date.now()) return NextResponse.json({ error: 'Choose a date in the future.' }, { status: 400 });
  const product = await createViewing({ productId: v.productId, name: v.name, phone: v.phone, email: v.email ?? '', preferredAt, note: v.note ?? '' });
  await emailNewViewing({ product: product ?? 'a furniture piece', name: v.name, when: dateTime(preferredAt), phone: v.phone, email: v.email ?? '' });
  return NextResponse.json({ ok: true });
}
