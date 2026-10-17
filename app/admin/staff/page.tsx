import { requireStaff } from '@/lib/auth';
import { listStaff } from '@/lib/store';
import { StaffAdd, StaffRowControls } from '@/components/admin/StaffControls';

export const metadata = { title: 'Staff' };

export default async function Staff() {
  const me = await requireStaff('manage_staff');
  const staff = await listStaff();
  return (
    <div className="max-w-[1000px]">
      <h1 className="display text-[36px] leading-none">Staff</h1>
      <div className="mt-4 text-[14px] text-ash max-w-[70ch] space-y-1">
        <p><span className="text-ink">Sales</span> can use the showroom and counter screens, see orders and update their status.</p>
        <p><span className="text-ink">Managers</span> can also add products, change prices and stock, give discounts, cancel orders and see sales reports.</p>
        <p><span className="text-ink">Owners</span> can also manage staff, store details and delivery prices.</p>
      </div>
      <ul className="mt-8 bg-white border border-stone divide-y divide-stone">
        {staff.map((s) => (
          <li key={s.id} className="px-4 py-4 grid gap-3 md:grid-cols-[1fr_auto] items-center text-[14px]">
            <div className={s.active ? '' : 'opacity-50'}>
              <p>{s.name}{s.id === me.id && <span className="text-ash"> (you)</span>}{!s.active && <span className="text-ash"> (switched off)</span>}</p>
              <p className="text-ash">{s.email}</p>
            </div>
            <StaffRowControls id={s.id} role={s.role} active={s.active} self={s.id === me.id} />
          </li>
        ))}
      </ul>
      <StaffAdd />
    </div>
  );
}
