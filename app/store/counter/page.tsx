import { can, requireStaff } from '@/lib/auth';
import Counter from '@/components/store/Counter';

export const metadata = { title: 'Counter' };

export default async function CounterPage() {
  const staff = await requireStaff('sell');
  return <Counter canDiscount={can(staff.role, 'discount')} />;
}
