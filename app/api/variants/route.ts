import { NextResponse } from 'next/server';
import { getVariants } from '@/lib/store';

export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f-]{36}$/i;

export async function GET(req: Request) {
  const ids = (new URL(req.url).searchParams.get('ids') ?? '').split(',').filter((id) => UUID.test(id)).slice(0, 100);
  const variants = await getVariants(ids);
  return NextResponse.json(
    variants.map((v) => ({
      id: v.id,
      product_name: v.product_name,
      product_slug: v.product_slug,
      size: v.size,
      colour: v.colour,
      price: v.price,
      stock: v.stock,
      image: v.image,
      department: v.department,
      availability: v.availability,
      allow_deposit: v.allow_deposit,
    })),
  );
}
