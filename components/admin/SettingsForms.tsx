'use client';

import { useActionState, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { deleteZoneAction, saveSettingsAction, saveZoneAction, type ActionResult } from '@/lib/actions/admin';
import type { DeliveryZone, StoreSettings } from '@/lib/types';

export function SettingsForm({ settings }: { settings: StoreSettings }) {
  const [state, action, pending] = useActionState(saveSettingsAction, undefined);
  const field = (name: keyof StoreSettings, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className={props.className}>
      <span className="label">{label}</span>
      <input name={name} defaultValue={String(settings[name])} className="field" {...props} />
    </label>
  );
  return (
    <form action={action} className="mt-10 grid gap-4 sm:grid-cols-2">
      <h2 className="sm:col-span-2 text-[17px]">Store details</h2>
      <p className="sm:col-span-2 -mt-2 text-[13px] text-ash">Shown in the footer, on the Visit and Contact pages, in emails and on receipts.</p>
      {field('storeName', 'Store name', { required: true, className: 'sm:col-span-2' })}
      {field('address', 'Street address', { required: true })}
      {field('city', 'City', { required: true })}
      {field('phone', 'Phone number', { required: true })}
      {field('whatsapp', 'WhatsApp number, with country code (2348012345678)', { required: true, inputMode: 'numeric' })}
      {field('email', 'Email address', { type: 'email', required: true })}
      {field('hours', 'Opening hours', { required: true })}
      {field('receiptFooter', 'Message at the bottom of receipts', { className: 'sm:col-span-2' })}
      <h2 className="sm:col-span-2 text-[17px] mt-6">Payments</h2>
      {field('depositPercent', 'Furniture deposit (%)', { type: 'number', min: 10, max: 90 })}
      {field('reserveMinutes', 'Hold unpaid online orders for (minutes)', { type: 'number', min: 10, max: 240 })}
      {state && <p className={`sm:col-span-2 text-[14px] ${state.error ? 'text-alert' : ''}`} role="status">{state.error ?? state.ok}</p>}
      <button className="btn sm:col-span-2 justify-self-start" disabled={pending}>Save store details</button>
    </form>
  );
}

export function ZonesEditor({ zones }: { zones: DeliveryZone[] }) {
  return (
    <section className="mt-14">
      <h2 className="text-[17px]">Delivery areas and prices</h2>
      <p className="mt-1 text-[13px] text-ash max-w-[70ch]">
        Customers choose an area at checkout. An order with both fashion and furniture pays both prices. Switch an area off to hide it without deleting it.
      </p>
      <div className="mt-4 bg-white border border-stone overflow-x-auto">
        <table className="w-full min-w-[720px] text-[14px]">
          <thead className="text-left text-ash text-[13px]">
            <tr className="border-b border-stone">
              <th className="font-normal px-3 py-3">Area</th>
              <th className="font-normal px-3 py-3">Fashion (₦)</th>
              <th className="font-normal px-3 py-3">Furniture (₦)</th>
              <th className="font-normal px-3 py-3">Shown</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-stone">
            {zones.map((z) => <ZoneRow key={z.id} zone={z} />)}
            <ZoneRow />
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ZoneRow({ zone }: { zone?: DeliveryZone }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [v, setV] = useState({ name: zone?.name ?? '', fashion_fee: zone?.fashion_fee ?? 0, furniture_fee: zone?.furniture_fee ?? 0, active: zone?.active ?? true });
  const [msg, setMsg] = useState<ActionResult | null>(null);
  const dirty = !zone || v.name !== zone.name || v.fashion_fee !== zone.fashion_fee || v.furniture_fee !== zone.furniture_fee || v.active !== zone.active;
  const run = (fn: () => Promise<ActionResult>) =>
    start(async () => {
      const r = await fn();
      setMsg(r);
      if (!r.error) {
        if (!zone) setV({ name: '', fashion_fee: 0, furniture_fee: 0, active: true });
        router.refresh();
      }
    });
  return (
    <tr>
      <td className="px-3 py-2"><input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} placeholder={zone ? '' : 'Add a new area'} className="field h-9" /></td>
      <td className="px-3 py-2 w-36"><input type="number" min={0} value={v.fashion_fee} onChange={(e) => setV({ ...v, fashion_fee: Number(e.target.value) })} className="field h-9" /></td>
      <td className="px-3 py-2 w-36"><input type="number" min={0} value={v.furniture_fee} onChange={(e) => setV({ ...v, furniture_fee: Number(e.target.value) })} className="field h-9" /></td>
      <td className="px-3 py-2"><input type="checkbox" checked={v.active} onChange={(e) => setV({ ...v, active: e.target.checked })} className="accent-ink w-4 h-4" aria-label="Shown at checkout" /></td>
      <td className="px-3 py-2 whitespace-nowrap">
        <button className="btn-quiet btn-sm" disabled={pending || !dirty || !v.name.trim()} onClick={() => run(() => saveZoneAction({ id: zone?.id, ...v }))}>{zone ? 'Save' : 'Add area'}</button>
        {zone && (
          <button className="ml-3 text-[13px] text-ash hover:text-alert" disabled={pending} onClick={() => window.confirm(`Delete ${zone.name}?`) && run(() => deleteZoneAction(zone.id))}>Delete</button>
        )}
        {msg?.error && <p className="text-[12px] text-alert mt-1">{msg.error}</p>}
      </td>
    </tr>
  );
}
