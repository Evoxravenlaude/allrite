import type { Metadata } from 'next';
import Link from 'next/link';
import { currentCustomer } from '@/lib/auth';
import { ordersForCustomer } from '@/lib/store';
import { dateOnly, naira, statusLabel } from '@/lib/format';
import { signOut } from '@/lib/actions/customer';
import { AuthForms, ProfileForm } from '@/components/shop/AccountForms';

export const metadata: Metadata = { title: 'Account', robots: { index: false } };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const customer = await currentCustomer();
  if (!customer) {
    return (
      <div className="page-x mx-auto max-w-page pt-10 sm:pt-14">
        <h1 className="display text-[40px] sm:text-[56px] leading-none">Account</h1>
        <p className="mt-4 text-ash text-[15px] max-w-[60ch]">
          An account keeps your order history and your Saved list in one place. You never need one to buy.
        </p>
        <AuthForms next={next ?? '/account'} />
      </div>
    );
  }
  const orders = await ordersForCustomer(customer.id);
  return (
    <div className="page-x mx-auto max-w-page pt-10 sm:pt-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="display text-[40px] sm:text-[56px] leading-none">Hello, {customer.name.split(' ')[0] || 'there'}</h1>
        <form action={signOut}>
          <button className="link text-[14px]">Sign out</button>
        </form>
      </div>
      <div className="mt-12 grid gap-14 lg:grid-cols-12">
        <section className="lg:col-span-8">
          <h2 className="text-[17px] mb-5">Your orders</h2>
          {orders.length === 0 ? (
            <p className="text-ash text-[15px]">
              No orders yet. <Link href="/new-arrivals" className="link text-ink">See what is new</Link>.
            </p>
          ) : (
            <ul className="border-t border-stone divide-y divide-stone text-[14px]">
              {orders.map((o) => (
                <li key={o.id}>
                  <Link href={`/order/${o.number}`} className="py-4 grid grid-cols-[1fr_auto] sm:grid-cols-[8rem_1fr_10rem_auto] gap-x-6 gap-y-1 hover:bg-white/60">
                    <span>{o.number}</span>
                    <span className="text-ash sm:text-ink truncate">{o.items.map((i) => i.name).join(', ')}</span>
                    <span className="text-ash">{dateOnly(o.created_at)}</span>
                    <span className="text-right">
                      {naira(o.total)}
                      <span className="block text-ash">{statusLabel(o.status, o.fulfilment)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="lg:col-span-4">
          <h2 className="text-[17px] mb-5">Your details</h2>
          <ProfileForm name={customer.name} phone={customer.phone} email={customer.email} />
          <Link href="/saved" className="link text-[14px] inline-block mt-8">Go to your Saved list</Link>
        </section>
      </div>
    </div>
  );
}
