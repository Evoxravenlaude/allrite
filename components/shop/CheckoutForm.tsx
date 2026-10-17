'use client';

import Link from 'next/link';
import { useState } from 'react';
import { naira } from '@/lib/format';
import { computeTotals } from '@/lib/totals';
import type { DeliveryZone } from '@/lib/types';
import { useShop } from './state';
import { maxQty, useBagVariants } from './BagDrawer';

type Customer = { name: string; email: string; phone: string } | null;

export default function CheckoutForm({
  zones,
  depositPercent,
  reserveMinutes,
  storeAddress,
  storeHours,
  customer,
  demo,
}: {
  zones: DeliveryZone[];
  depositPercent: number;
  reserveMinutes: number;
  storeAddress: string;
  storeHours: string;
  customer: Customer;
  demo: boolean;
}) {
  const { lines, clear } = useShop();
  const { variants, loading } = useBagVariants(lines.map((l) => l.variantId));
  const [fulfilment, setFulfilment] = useState<'delivery' | 'collection'>('delivery');
  const [zoneId, setZoneId] = useState<string>('');
  const [isGift, setIsGift] = useState(false);
  const [payDeposit, setPayDeposit] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const items = lines
    .filter((l) => variants[l.variantId])
    .map((l) => {
      const v = variants[l.variantId];
      return { ...v, qty: l.qty, allow_deposit: !!v.allow_deposit };
    });
  const zone = zones.find((z) => z.id === zoneId) ?? null;
  const totals = computeTotals(items, zone, fulfilment, payDeposit, depositPercent);
  const blocked = items.some((i) => i.qty > maxQty(i));

  if (!loading && lines.length === 0) {
    return (
      <div className="py-16 max-w-[50ch]">
        <p className="display text-[26px]">Your bag is empty.</p>
        <p className="mt-3 text-ash">Add a piece to your bag, then come back here to pay.</p>
        <div className="mt-8 flex gap-3">
          <Link href="/fashion" className="btn-quiet">Shop fashion</Link>
          <Link href="/furniture" className="btn-quiet">Shop furniture</Link>
        </div>
      </div>
    );
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const form = new FormData(e.currentTarget);
    setSubmitting(true);
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lines,
        name: form.get('name'),
        email: form.get('email'),
        phone: form.get('phone'),
        fulfilment,
        zoneId: fulfilment === 'delivery' ? zoneId || null : null,
        address: form.get('address') ?? '',
        isGift,
        giftMessage: form.get('gift') ?? '',
        payDeposit: payDeposit && totals.depositEligible,
      }),
    });
    const body = await res.json();
    if (!res.ok) {
      setError(body.error ?? 'Checkout failed. Try again.');
      setSubmitting(false);
      return;
    }
    clear();
    window.location.href = body.url;
  }

  return (
    <form onSubmit={submit} className="mt-10 grid gap-12 lg:grid-cols-12" noValidate={false}>
      <div className="lg:col-span-7 space-y-12">
        <section>
          <h2 className="text-[17px] mb-5">Your details</h2>
          {!customer && (
            <p className="text-[14px] text-ash mb-5">
              Have an account?{' '}
              <Link href="/account?next=/checkout" className="link text-ink">
                Sign in
              </Link>{' '}
              to see this order in your order history. You can also check out without one.
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="label">Full name</span>
              <input name="name" required defaultValue={customer?.name} autoComplete="name" className="field" />
            </label>
            <label>
              <span className="label">Email, for your confirmation</span>
              <input name="email" type="email" required defaultValue={customer?.email} autoComplete="email" className="field" />
            </label>
            <label>
              <span className="label">Phone, for delivery updates</span>
              <input name="phone" type="tel" required defaultValue={customer?.phone} autoComplete="tel" className="field" />
            </label>
          </div>
        </section>

        <section>
          <h2 className="text-[17px] mb-5">Delivery or collection</h2>
          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup">
            {(
              [
                ['delivery', 'Deliver to me', 'Priced by area. Shown before you pay.'],
                ['collection', 'Collect from the store', `Free. ${storeAddress}.`],
              ] as const
            ).map(([value, title, sub]) => (
              <label
                key={value}
                className={`p-4 border cursor-pointer text-[14px] ${fulfilment === value ? 'border-ink bg-white' : 'border-stone hover:border-ash'}`}
              >
                <input type="radio" name="fulfilment" value={value} checked={fulfilment === value} onChange={() => setFulfilment(value)} className="sr-only" />
                <span className="block">{title}</span>
                <span className="block text-ash mt-0.5">{sub}</span>
              </label>
            ))}
          </div>
          {fulfilment === 'delivery' ? (
            <div className="mt-5 grid gap-4">
              <label>
                <span className="label">Delivery area</span>
                <select required value={zoneId} onChange={(e) => setZoneId(e.target.value)} className="field">
                  <option value="">Choose your area</option>
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="label">Delivery address, with landmarks</span>
                <textarea name="address" required rows={3} autoComplete="street-address" className="field" />
              </label>
            </div>
          ) : (
            <p className="mt-4 text-[14px] text-ash">We will message you when your order is ready to collect. Opening hours: {storeHours}.</p>
          )}
        </section>

        <section>
          <h2 className="text-[17px] mb-4">Sending a gift?</h2>
          <label className="flex items-center gap-3 text-[14px] cursor-pointer">
            <input type="checkbox" checked={isGift} onChange={(e) => setIsGift(e.target.checked)} className="w-4 h-4 accent-ink" />
            This order is a gift. Leave prices off the packing slip.
          </label>
          {isGift && (
            <label className="block mt-4">
              <span className="label">Gift message, printed and placed in the parcel</span>
              <textarea name="gift" rows={3} maxLength={300} className="field" />
            </label>
          )}
        </section>

        {totals.depositEligible && (
          <section>
            <h2 className="text-[17px] mb-5">How much to pay now</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  [false, 'Pay in full', naira(computeTotals(items, zone, fulfilment, false, depositPercent).dueNow)],
                  [true, `Pay a ${depositPercent}% deposit on furniture`, `${naira(computeTotals(items, zone, fulfilment, true, depositPercent).dueNow)} now, the rest before delivery`],
                ] as const
              ).map(([value, title, sub]) => (
                <label key={String(value)} className={`p-4 border cursor-pointer text-[14px] ${payDeposit === value ? 'border-ink bg-white' : 'border-stone hover:border-ash'}`}>
                  <input type="radio" name="deposit" checked={payDeposit === value} onChange={() => setPayDeposit(value)} className="sr-only" />
                  <span className="block">{title}</span>
                  <span className="block text-ash mt-0.5">{sub}</span>
                </label>
              ))}
            </div>
          </section>
        )}
      </div>

      <aside className="lg:col-span-5">
        <div className="bg-white p-6 sm:p-8 lg:sticky lg:top-24">
          <h2 className="text-[17px]">Your order</h2>
          <ul className="mt-5 divide-y divide-stone text-[14px]">
            {items.map((i) => (
              <li key={i.id} className="py-4 flex gap-4">
                <div className="w-16 aspect-[4/5] bg-mist shrink-0">{i.image && <img src={i.image} alt="" className="w-full h-full object-cover" />}</div>
                <div className="flex-1">
                  <p>{i.product_name}</p>
                  <p className="text-ash">{[i.size, i.colour].filter(Boolean).join(', ')} × {i.qty}</p>
                  {i.qty > maxQty(i) && <p className="text-alert">Only {maxQty(i)} left. Update your bag.</p>}
                </div>
                <p>{naira(i.price * i.qty)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-4 pt-4 border-t border-stone text-[14px] space-y-2">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{naira(totals.subtotal)}</dd></div>
            <div className="flex justify-between">
              <dt>{fulfilment === 'collection' ? 'Collection' : 'Delivery'}</dt>
              <dd>{fulfilment === 'collection' ? 'Free' : zone ? naira(totals.deliveryFee) : 'Choose an area'}</dd>
            </div>
            <div className="flex justify-between text-[16px] pt-2"><dt>Total</dt><dd>{naira(totals.total)}</dd></div>
            {totals.balance > 0 && (
              <>
                <div className="flex justify-between"><dt>Pay now</dt><dd>{naira(totals.dueNow)}</dd></div>
                <div className="flex justify-between text-ash"><dt>Balance before delivery</dt><dd>{naira(totals.balance)}</dd></div>
              </>
            )}
          </dl>
          {error && (
            <p className="mt-5 text-[14px] text-alert" role="alert">
              {error}
            </p>
          )}
          <button className="btn w-full mt-6" disabled={submitting || blocked || loading || (fulfilment === 'delivery' && !zone)}>
            {submitting ? 'Opening secure payment' : `Pay ${naira(totals.dueNow)}`}
          </button>
          <p className="mt-4 text-[12px] text-ash leading-relaxed">
            You pay securely through Paystack by card, bank transfer or USSD. Your pieces are held for {reserveMinutes} minutes while you pay.
            {demo && ' Demo mode: no real money is taken.'}
          </p>
        </div>
      </aside>
    </form>
  );
}
