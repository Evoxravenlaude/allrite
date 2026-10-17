import { NextResponse } from 'next/server';
import { stockLevels } from '@/lib/store';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f-]{36}$/i;

export async function GET(req: Request) {
  const products = (new URL(req.url).searchParams.get('products') ?? '').split(',').filter((id) => UUID.test(id)).slice(0, 200);
  if (!products.length) return NextResponse.json({});
  return NextResponse.json(await stockLevels(products), { headers: { 'Cache-Control': 'no-store' } });
}
