import { staffRoute } from '@/lib/api';
import { q } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const GET = staffRoute('sell', async (_staff, req) => {
  const term = (new URL(req.url).searchParams.get('q') ?? '').trim();
  if (term.length < 2) return [];
  return q(
    `select v.*, p.name as product_name, p.slug as product_slug, p.department, p.price, p.images->0->>'url' as image, p.availability
     from variants v join products p on p.id = v.product_id
     where p.name ilike $1 or v.barcode = $2 or v.colour ilike $1 order by p.name, v.sort limit 30`,
    [`%${term}%`, term],
  );
});
