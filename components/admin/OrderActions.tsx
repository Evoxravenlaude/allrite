'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { cancelOrderAction, orderNoteAction, orderStatusAction, settleOrderAction, type ActionResult } from '@/lib/actions/admin';
import { statusLabel, PAYMENT_PHRASE } from '@/lib/format';
import type { Order } from '@/lib/types';

type Props = {
  order: Pick<Order, 'id' | 'status' | 'fulfilment' | 'channel' | 'payment_status' | 'email' | 'note'> & { balance: number };
  statusText: string;
  paymentText: string;
  canCancel: boolean;
  payLink: string;
};

export default function OrderActions({ order, statusText, paymentText, canCancel, payLink }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [notify, setNotify] = useState(true);
  const [note, setNote] = useState(order.note);
  const [copied, setCopied] = useState(false);

  const act = (fn: () => Promise<ActionResult>) =>
    start(async () => {
      const r = await fn();
      setResult(r);
      router.refresh();
    });

  const next: Order['status'][] =
    order.fulfilment === 'delivery' ? ['preparing', 'sent', 'delivered'] : order.fulfilment === 'collection' ? ['preparing', 'sent', 'collected'] : [];
  const paid = order.payment_status !== 'unpaid';
  const live = order.status !== 'cancelled';

  return (
    <aside className="space-y-6">
      <section className="bg-white border border-stone p-5">
        <p className="text-[13px] text-ash">Status</p>
        <p className="display text-[26px] leading-tight">{statusText}</p>
        <p className="text-[14px] mt-1">{paymentText}</p>
        {live && paid && next.length > 0 && (
          <div className="mt-5 grid gap-2">
            {next.map((s) => (
              <button
                key={s}
                disabled={pending || s === order.status}
                onClick={() => act(() => orderStatusAction(order.id, s, notify))}
                className={`h-11 border text-[14px] ${s === order.status ? 'bg-ink text-white border-ink' : 'border-stone hover:border-ink'}`}
              >
                {s === order.status ? `Now: ${statusLabel(s, order.fulfilment)}` : `Mark as ${statusLabel(s, order.fulfilment).toLowerCase()}`}
              </button>
            ))}
            {order.email && (
              <label className="mt-1 flex items-center gap-2 text-[13px]">
                <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} className="accent-ink" />
                Email the customer when the status changes
              </label>
            )}
          </div>
        )}
        {live && !paid && order.channel === 'online' && <p className="mt-4 text-[13px] text-ash">The customer has not paid yet. Unpaid online orders release their stock automatically.</p>}
      </section>

      {live && order.balance > 0 && paid && (
        <section className="bg-white border border-stone p-5">
          <h2 className="text-[15px]">Collect the balance</h2>
          <p className="text-[13px] text-ash mt-1">Send the customer this link to pay online, or record a payment taken in the store.</p>
          <div className="mt-3 flex gap-2">
            <input readOnly value={payLink} className="field h-10 text-[12px]" onFocus={(e) => e.target.select()} />
            <button className="btn-quiet btn-sm h-10 shrink-0" onClick={() => navigator.clipboard.writeText(payLink).then(() => setCopied(true))}>{copied ? 'Copied' : 'Copy'}</button>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(['cash', 'transfer', 'pos_card'] as const).map((m) => (
              <button
                key={m}
                disabled={pending}
                onClick={() => window.confirm(`Record the balance as paid by ${PAYMENT_PHRASE[m]}?`) && act(() => settleOrderAction(order.id, m))}
                className="h-10 border border-stone hover:border-ink text-[12px]"
              >
                Paid by {PAYMENT_PHRASE[m]}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="bg-white border border-stone p-5">
        <h2 className="text-[15px]">Team note</h2>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="field mt-2 text-[14px]" placeholder="Seen only by staff" />
        <button className="btn-quiet btn-sm mt-2" disabled={pending || note === order.note} onClick={() => act(() => orderNoteAction(order.id, note))}>Save note</button>
      </section>

      {live && canCancel && (
        <button
          className="text-[13px] text-alert hover:underline"
          disabled={pending}
          onClick={() =>
            window.confirm('Cancel this order? Its pieces go back into stock. Any refund must be made separately.') && act(() => cancelOrderAction(order.id))
          }
        >
          Cancel this order
        </button>
      )}

      {result && <p className={`text-[14px] ${result.error ? 'text-alert' : ''}`} role="status">{result.error ?? result.ok}</p>}
    </aside>
  );
}
