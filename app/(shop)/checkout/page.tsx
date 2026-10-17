import type { Metadata } from 'next';
import { currentCustomer } from '@/lib/auth';
import { getSettings, listZones } from '@/lib/store';
import { paystackLive } from '@/lib/paystack';
import CheckoutForm from '@/components/shop/CheckoutForm';

export const metadata: Metadata = { title: 'Checkout', robots: { index: false } };

export default async function CheckoutPage() {
  const [zones, settings, customer] = await Promise.all([listZones(), getSettings(), currentCustomer()]);
  return (
    <div className="page-x mx-auto max-w-page pt-10 sm:pt-14">
      <h1 className="display text-[40px] sm:text-[52px] leading-none">Checkout</h1>
      <CheckoutForm
        zones={zones}
        depositPercent={settings.depositPercent}
        reserveMinutes={settings.reserveMinutes}
        storeAddress={`${settings.address}, ${settings.city}`}
        storeHours={settings.hours}
        customer={customer ? { name: customer.name, email: customer.email, phone: customer.phone } : null}
        demo={!paystackLive()}
      />
    </div>
  );
}
