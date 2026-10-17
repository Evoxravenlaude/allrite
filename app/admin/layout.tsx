import { requireStaff, can } from '@/lib/auth';
import AdminNav from '@/components/admin/AdminNav';
import { dashboardCounts } from '@/lib/store';

export const metadata = { title: { default: 'Dashboard', template: '%s | Allrite dashboard' }, robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff();
  const counts = await dashboardCounts();
  const perms = {
    products: can(staff.role, 'edit_products'),
    stock: can(staff.role, 'edit_stock'),
    reports: can(staff.role, 'view_reports'),
    staff: can(staff.role, 'manage_staff'),
    settings: can(staff.role, 'manage_settings'),
    customers: can(staff.role, 'view_customers'),
  };
  return (
    <div className="min-h-svh bg-paper lg:grid lg:grid-cols-[232px_1fr]">
      <AdminNav name={staff.name} role={staff.role} perms={perms} counts={counts} />
      <main className="min-w-0 px-4 sm:px-8 py-8 lg:py-10">{children}</main>
    </div>
  );
}
