import { redirect } from 'next/navigation';
import { currentStaff } from '@/lib/auth';
import { dbKind } from '@/lib/db';
import StaffLoginForm from './StaffLoginForm';

export const metadata = { title: 'Staff sign in', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function StaffLogin() {
  const staff = await currentStaff();
  if (staff) redirect(staff.role === 'sales' ? '/store/counter' : '/admin');
  // The demo sign-ins are shown only on a local computer, never on a public preview.
  const demo = (await dbKind()) === 'embedded' && !process.env.VERCEL;
  return (
    <div className="min-h-svh grid place-items-center px-4 bg-paper">
      <div className="w-full max-w-[400px]">
        <p className="font-display tracking-[0.28em] text-[26px] text-center">ALLRITE</p>
        <h1 className="text-center text-[15px] text-ash mt-2">Staff sign in</h1>
        <StaffLoginForm />
        {demo && (
          <div className="mt-8 p-4 bg-white border border-stone text-[13px] leading-relaxed">
            <p className="text-ash mb-1">Demo accounts</p>
            <p>Owner: owner@allrite.demo / allrite-owner</p>
            <p>Manager: manager@allrite.demo / allrite-manager</p>
            <p>Sales: sales@allrite.demo / allrite-sales</p>
          </div>
        )}
      </div>
    </div>
  );
}
