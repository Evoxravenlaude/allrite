import { requireStaff } from '@/lib/auth';
import { listProducts, listZones } from '@/lib/store';
import Showroom from '@/components/store/Showroom';

export const metadata = { title: 'Showroom' };

export default async function ShowroomPage() {
  await requireStaff('sell');
  const [products, zones] = await Promise.all([listProducts({ sort: 'name' }), listZones()]);
  return <Showroom products={products} zones={zones} />;
}
