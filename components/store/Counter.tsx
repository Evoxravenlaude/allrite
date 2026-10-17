'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { naira, PAYMENT_LABEL, PAYMENT_PHRASE, statusLabel } from '@/lib/format';
import type { Order } from '@/lib/types';

type Item = {
  id: string;
  product_name: string;
  size: string;
  colour: string;
  barcode: string;
  price: number;
  stock: number;
  image: string | null;
  availability: 'ready' | 'made_to_order';
};
type Line = { item: Item; qty: number };
type Method = 'cash' | 'transfer' | 'pos_card';

const METHODS: Method[] = ['cash', 'transfer', 'pos_card'];

async function api<T>(url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, body === undefined ? { cache: 'no-store' } : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Something went wrong.');
  return data as T;
}

export default function Counter({ canDiscount }: { canDiscount: boolean }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [scan, setScan] = useState('');
  const [results, setResults] = useState<Item[]>([]);
  const [message, setMessage] = useState<{ text: string; tone: 'error' | 'info' } | null>(null);
  const [held, setHeld] = useState<Order[]>([]);
  const [settling, setSettling] = useState<Order | null>(null);
  const [discount, setDiscount] = useState(0);
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '' });
  const [method, setMethod] = useState<Method | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<Order | null>(null);
  const scanRef = useRef<HTMLInputElement>(null);

  const focusScan = () => {
    window.setTimeout(() => scanRef.current?.focus(), 30);
  };

  const loadHeld = useCallback(async () => {
    try {
      setHeld(await api<Order[]>('/api/store/held'));
    } catch {
      /* try again on the next tick */
    }
  }, []);

  useEffect(() => {
    loadHeld();
    const id = window.setInterval(loadHeld, 8000);
    return () => window.clearInterval(id);
  }, [loadHeld]);

  useEffect(() => {
    focusScan();
  }, []);

  function addItem(item: Item) {
    setSettling(null);
    setLines((ls) => {
      const found = ls.find((l) => l.item.id === item.id);
      const want = (found?.qty ?? 0) + 1;
      if (item.availability !== 'made_to_order' && want > item.stock) {
        setMessage({
          text: item.stock <= 0 ? `${item.product_name} shows no stock left. Check the stock count in the dashboard.` : `Only ${item.stock} of ${item.product_name} in stock.`,
          tone: 'error',
        });
        return ls;
      }
      setMessage({ text: `Added ${item.product_name}${item.size ? `, ${item.size}` : ''}.`, tone: 'info' });
      return found ? ls.map((l) => (l.item.id === item.id ? { ...l, qty: want } : l)) : [...ls, { item, qty: 1 }];
    });
  }

  async function submitScan(e: React.FormEvent) {
    e.preventDefault();
    const value = scan.trim();
    if (!value) return;
    setScan('');
    setResults([]);
    try {
      if (/^AR-?\d+$/i.test(value)) {
        const [order] = await api<Order[]>(`/api/store/held?number=${encodeURIComponent(value.toUpperCase().replace(/^AR(\d)/, 'AR-$1'))}`);
        openOrder(order);
      } else if (/^\d{6,}$/.test(value)) {
        addItem(await api<Item>(`/api/store/barcode?code=${value}`));
      } else {
        const found = await api<Item[]>(`/api/store/search?q=${encodeURIComponent(value)}`);
        if (found.length === 0) setMessage({ text: `Nothing matches “${value}”.`, tone: 'error' });
        setResults(found);
      }
    } catch (err) {
      setMessage({ text: (err as Error).message, tone: 'error' });
    }
    focusScan();
  }

  function openOrder(order: Order) {
    if (order.payment_status === 'paid') {
      setMessage({ text: `${order.number} is already paid in full.`, tone: 'info' });
      return;
    }
    if (order.status === 'cancelled') {
      setMessage({ text: `${order.number} was cancelled.`, tone: 'error' });
      return;
    }
    setLines([]);
    setSettling(order);
    setMethod(null);
    setMessage(null);
  }

  function reset() {
    setLines([]);
    setSettling(null);
    setDiscount(0);
    setCustomer({ name: '', email: '', phone: '' });
    setMethod(null);
    setDone(null);
    setMessage(null);
    loadHeld();
    focusScan();
  }

  const subtotal = settling ? settling.total - settling.amount_paid : lines.reduce((s, l) => s + l.item.price * l.qty, 0);
  const total = settling ? subtotal : Math.max(0, subtotal - discount);

  async function complete() {
    if (!method) return;
    setBusy(true);
    try {
      const order = settling
        ? await api<Order>('/api/store/settle', { orderId: settling.id, method })
        : await api<Order>('/api/store/sale', {
            lines: lines.map((l) => ({ variantId: l.item.id, qty: l.qty })),
            method,
            discount: canDiscount ? discount : 0,
            customer,
          });
      setDone(order);
      loadHeld();
    } catch (err) {
      setMessage({ text: (err as Error).message, tone: 'error' });
    } finally {
      setBusy(false);
    }
  }

  async function cancelHeld(order: Order) {
    if (!window.confirm(`Cancel ${order.number} for ${order.customer_name}? The pieces go back into stock.`)) return;
    try {
      await api('/api/store/cancel', { orderId: order.id });
      if (settling?.id === order.id) reset();
      else loadHeld();
    } catch (err) {
      setMessage({ text: (err as Error).message, tone: 'error' });
    }
  }

  if (done) return <SaleDone order={done} onNext={reset} />;

  return (
    <div className="grid lg:grid-cols-[1fr_420px] min-h-[calc(100svh-4rem)]">
      <section className="p-4 sm:p-6 lg:p-8">
        <form onSubmit={submitScan} className="flex gap-3">
          <label htmlFor="scan" className="sr-only">Scan a barcode, type a name, or enter an order number</label>
          <input
            id="scan"
            ref={scanRef}
            value={scan}
            onChange={(e) => setScan(e.target.value)}
            placeholder="Scan a tag, type a name, or enter an order number"
            className="field h-14 text-[18px] flex-1"
            autoComplete="off"
            inputMode="search"
          />
          <button className="btn h-14 px-8">Find</button>
        </form>
        <div className="min-h-7 mt-3 text-[14px]" aria-live="polite">
          {message && <p className={message.tone === 'error' ? 'text-alert' : 'text-ash'}>{message.text}</p>}
        </div>

        {results.length > 0 && (
          <ul className="mt-2 mb-6 bg-white border border-stone divide-y divide-stone">
            {results.map((r) => (
              <li key={r.id}>
                <button
                  className="w-full text-left px-4 py-3 flex items-center gap-4 hover:bg-mist disabled:opacity-40"
                  onClick={() => {
                    addItem(r);
                    setResults([]);
                    focusScan();
                  }}
                >
                  <span className="flex-1">
                    {r.product_name}
                    <span className="text-ash"> {[r.size, r.colour].filter(Boolean).join(', ')}</span>
                  </span>
                  <span className="text-ash text-[13px]">{r.availability === 'made_to_order' ? 'Made to order' : `${r.stock} in stock`}</span>
                  <span>{naira(r.price)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {settling ? (
          <div className="mt-4 bg-white border border-ink p-6">
            <div className="flex justify-between gap-4">
              <div>
                <p className="text-[13px] text-ash">{settling.channel === 'showroom' ? 'Placed on the showroom screen' : 'Online order'}{settling.staff_name ? ` by ${settling.staff_name}` : ''}</p>
                <h2 className="display text-[28px]">{settling.number}</h2>
                <p className="text-[15px]">{settling.customer_name} {settling.phone && <span className="text-ash">{settling.phone}</span>}</p>
              </div>
              <button className="text-[14px] link self-start" onClick={reset}>Close</button>
            </div>
            <ul className="mt-5 divide-y divide-stone border-y border-stone text-[15px]">
              {settling.items.map((i) => (
                <li key={i.id} className="py-3 flex justify-between">
                  <span>{i.name} <span className="text-ash">{[i.size, i.colour].filter(Boolean).join(', ')} × {i.qty}</span></span>
                  <span>{naira(i.price * i.qty)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[14px] text-ash">
              {settling.fulfilment === 'delivery' ? `Delivery to ${settling.zone_name}: ${naira(settling.delivery_fee)}` : settling.fulfilment === 'collection' ? 'Customer collects later' : 'Customer takes the pieces today'}
              {settling.amount_paid > 0 && `. Already paid ${naira(settling.amount_paid)}.`}
            </p>
          </div>
        ) : lines.length === 0 ? (
          <div className="mt-10 text-ash text-[15px] max-w-[52ch]">
            <p className="display text-[28px] text-ink">Ready for the next sale.</p>
            <p className="mt-2">Scan the barcode on each tag. Pieces appear here with their price. To take payment for an order placed on the showroom screen, choose it on the right or type its number.</p>
          </div>
        ) : (
          <ul className="mt-4 bg-white divide-y divide-stone">
            {lines.map((l) => (
              <li key={l.item.id} className="p-4 flex items-center gap-4">
                <div className="w-14 aspect-[4/5] bg-mist shrink-0">{l.item.image && <img src={l.item.image} alt="" className="w-full h-full object-cover" />}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[16px]">{l.item.product_name}</p>
                  <p className="text-[13px] text-ash">{[l.item.size, l.item.colour, l.item.barcode].filter(Boolean).join(' / ')}</p>
                </div>
                <div className="flex items-center border border-stone">
                  <button className="w-11 h-11 text-[18px]" onClick={() => setLines((ls) => ls.map((x) => (x.item.id === l.item.id ? { ...x, qty: x.qty - 1 } : x)).filter((x) => x.qty > 0))} aria-label="One fewer">−</button>
                  <span className="w-8 text-center text-[16px]">{l.qty}</span>
                  <button className="w-11 h-11 text-[18px]" onClick={() => addItem(l.item)} aria-label="One more">+</button>
                </div>
                <p className="w-28 text-right text-[16px]">{naira(l.item.price * l.qty)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <aside className="bg-white border-l border-stone p-4 sm:p-6 lg:p-8 flex flex-col gap-8">
        <div>
          <h2 className="text-[15px] mb-3">Waiting for payment</h2>
          {held.length === 0 ? (
            <p className="text-[14px] text-ash">No orders from the showroom screen.</p>
          ) : (
            <ul className="space-y-2">
              {held.map((o) => (
                <li key={o.id} className={`border ${settling?.id === o.id ? 'border-ink' : 'border-stone'} flex`}>
                  <button className="flex-1 text-left p-3 text-[14px] hover:bg-mist" onClick={() => openOrder(o)}>
                    <span className="flex justify-between"><span>{o.number}</span><span>{naira(o.total)}</span></span>
                    <span className="block text-ash">{o.customer_name}, {o.items.reduce((n, i) => n + i.qty, 0)} pieces</span>
                  </button>
                  <button className="px-3 text-[13px] text-ash hover:text-alert" onClick={() => cancelHeld(o)} aria-label={`Cancel ${o.number}`}>Cancel</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {!settling && lines.length > 0 && (
          <div className="grid gap-3">
            <h2 className="text-[15px]">Customer, for the receipt (optional)</h2>
            <input placeholder="Name" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} className="field" />
            <input placeholder="Email, to send the receipt" type="email" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} className="field" />
            <input placeholder="Phone" type="tel" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} className="field" />
          </div>
        )}

        <div className="mt-auto">
          <dl className="text-[15px] space-y-2">
            <div className="flex justify-between"><dt>{settling ? 'Amount due' : 'Subtotal'}</dt><dd>{naira(subtotal)}</dd></div>
            {!settling && canDiscount && lines.length > 0 && (
              <div className="flex justify-between items-center gap-4">
                <dt><label htmlFor="discount">Discount (₦)</label></dt>
                <dd><input id="discount" type="number" min={0} max={subtotal} value={discount || ''} onChange={(e) => setDiscount(Math.min(subtotal, Math.max(0, Number(e.target.value) || 0)))} className="field h-10 w-36 text-right" /></dd>
              </div>
            )}
            <div className="flex justify-between text-[24px] pt-3 font-display"><dt>Total</dt><dd>{naira(total)}</dd></div>
          </dl>
          <fieldset className="mt-6">
            <legend className="text-[14px] text-ash mb-2">How did the customer pay?</legend>
            <div className="grid grid-cols-3 gap-2">
              {METHODS.map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  aria-pressed={method === m}
                  disabled={!settling && lines.length === 0}
                  className={`h-14 border text-[14px] ${method === m ? 'bg-ink text-white border-ink' : 'border-stone hover:border-ink disabled:opacity-40'}`}
                >
                  {PAYMENT_LABEL[m]}
                </button>
              ))}
            </div>
          </fieldset>
          <button className="btn w-full h-14 mt-4 text-[16px]" disabled={busy || !method || (!settling && lines.length === 0)} onClick={complete}>
            {busy ? 'Recording sale' : method ? `Complete sale, ${naira(total)} by ${PAYMENT_PHRASE[method]}` : 'Choose how the customer paid'}
          </button>
          {(lines.length > 0 || settling) && (
            <button className="w-full mt-3 text-[14px] text-ash hover:text-ink" onClick={reset}>Clear and start again</button>
          )}
        </div>
      </aside>
    </div>
  );
}

function SaleDone({ order, onNext }: { order: Order; onNext: () => void }) {
  const [email, setEmail] = useState(order.email);
  const [sent, setSent] = useState(!!order.email);
  const [error, setError] = useState('');
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'INPUT' && onNext();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onNext]);
  return (
    <div className="max-w-[560px] mx-auto px-4 py-14 text-center">
      <p className="text-[14px] text-ash">{order.number}, {statusLabel(order.status, order.fulfilment).toLowerCase()}</p>
      <h1 className="display text-[44px] leading-tight mt-2">Sale complete</h1>
      <p className="mt-2 text-[18px]">{naira(order.total)} by {PAYMENT_PHRASE[order.payment_method ?? 'cash']}</p>
      <p className="mt-1 text-[14px] text-ash">The stock count has gone down on the website and both store screens.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <a href={`/store/receipt/${order.id}?print=1`} target="_blank" rel="noreferrer" className="btn h-14 px-8">Print receipt</a>
        <button className="btn-quiet h-14 px-8" onClick={onNext} autoFocus>Next sale</button>
      </div>
      <div className="mt-10 text-left">
        {sent ? (
          <p className="text-[14px] text-ash text-center">Receipt emailed to {email}.</p>
        ) : (
          <form
            className="flex gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              setError('');
              try {
                await api('/api/store/email-receipt', { orderId: order.id, email });
                setSent(true);
              } catch (err) {
                setError((err as Error).message);
              }
            }}
          >
            <input type="email" required placeholder="Customer email for the receipt" value={email} onChange={(e) => setEmail(e.target.value)} className="field" />
            <button className="btn-quiet shrink-0">Email receipt</button>
          </form>
        )}
        {error && <p className="mt-2 text-alert text-[14px]">{error}</p>}
      </div>
    </div>
  );
}
