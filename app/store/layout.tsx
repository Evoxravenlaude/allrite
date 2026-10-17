import { requireStaff, can } from '@/lib/auth';
import StoreNav from '@/components/store/StoreNav';

export const metadata = { title: 'Store', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff('sell');
  return (
    <div className="min-h-svh bg-paper">
      <StoreNav name={staff.name} canAdmin={can(staff.role, 'view_reports') || can(staff.role, 'edit_products')} />
      {children}
    </div>
  );
}
