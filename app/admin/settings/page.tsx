import { requireStaff } from '@/lib/auth';
import { getSettings, listZones } from '@/lib/store';
import { paystackLive } from '@/lib/paystack';
import { dbKind } from '@/lib/db';
import { SettingsForm, ZonesEditor } from '@/components/admin/SettingsForms';

export const metadata = { title: 'Store and delivery' };

export default async function SettingsPage() {
  await requireStaff('manage_settings');
  const [settings, zones, kind] = await Promise.all([getSettings(), listZones(true), dbKind()]);
  const live = paystackLive();
  const email = !!process.env.RESEND_API_KEY;
  return (
    <div className="max-w-[1000px]">
      <h1 className="display text-[36px] leading-none">Store and delivery</h1>

      <section className="mt-8 grid gap-px bg-stone border border-stone sm:grid-cols-3 text-[14px]">
        {(
          [
            ['Payments', live ? 'Paystack is connected. Customers pay for real.' : 'Demo mode. Add the Paystack secret key to take real payments.', live],
            ['Database', kind === 'postgres' ? 'Connected to the live database.' : 'Demo database on this computer.', kind === 'postgres'],
            ['Emails', email ? 'Order and receipt emails are sent.' : 'Emails are not sent yet. Add an email key to switch them on.', email],
          ] as const
        ).map(([title, text, ok]) => (
          <div key={title} className="bg-white p-4">
            <p className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${ok ? 'bg-[#2E7D4F]' : 'bg-[#B7791F]'}`} aria-hidden="true" />{title}</p>
            <p className="text-ash text-[13px] mt-1">{text}</p>
          </div>
        ))}
      </section>

      <SettingsForm settings={settings} />
      <ZonesEditor zones={zones} />
    </div>
  );
}
