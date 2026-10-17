import { NextResponse } from 'next/server';
import { currentCustomer } from '@/lib/auth';
import { listSaved, setSaved } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const customer = await currentCustomer();
  if (!customer) return NextResponse.json([]);
  return NextResponse.json(await listSaved(customer.id));
}

export async function POST(req: Request) {
  const customer = await currentCustomer();
  if (!customer) return NextResponse.json({ error: 'Sign in to keep your Saved list on every device.' }, { status: 401 });
  const { productId, saved } = await req.json();
  if (typeof productId !== 'string') return NextResponse.json({ error: 'Missing product.' }, { status: 400 });
  await setSaved(customer.id, productId, !!saved);
  return NextResponse.json({ ok: true });
}
