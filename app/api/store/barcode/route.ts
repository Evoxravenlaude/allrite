import { staffRoute } from '@/lib/api';
import { getVariantByBarcode } from '@/lib/store';

export const dynamic = 'force-dynamic';

export const GET = staffRoute('sell', async (_staff, req) => {
  const code = new URL(req.url).searchParams.get('code') ?? '';
  const variant = await getVariantByBarcode(code);
  if (!variant) throw new Error(`No item has the barcode ${code}. Check the tag or search by name.`);
  return variant;
});
