import { NextResponse } from 'next/server';
import { productsByIds } from '@/lib/store';

export const dynamic = 'force-dynamic';
const UUID = /^[0-9a-f-]{36}$/i;

export async function GET(req: Request) {
  const ids = (new URL(req.url).searchParams.get('ids') ?? '').split(',').filter((id) => UUID.test(id)).slice(0, 100);
  return NextResponse.json(await productsByIds(ids));
}
