'use client';

import { useEffect, useMemo, useState } from 'react';
import { naira } from '@/lib/format';
import { computeTotals } from '@/lib/totals';
import type { DeliveryZone, Product, Variant } from '@/lib/types';

type Pick = { product: Product; variant: Variant; qty: number };

function useAllStock(initial: Record<string, number>, ids: string) {
  const [stock, setStock] = useState(initial);
  useEffect(() => {
    const tick = async () => {
      if (document.hidden) return;
      try {
        const res = await fetch(`/api/stock?products=${ids}`, { cache: 'no-store' });
        if (res.ok) setStock(await res.json());
      } catch {
        /* next tick */
      }
    };
    const t = window.setInterval(tick, 5000);
    return () => window.clearInterval(t);
  }, [ids]);
  return stock;
}

export default function Showroom({ products, zones }: { products: Product[]; zones: DeliveryZone[] }) {
  const [dept, setDept] = useState<'all' | 'fashion' | 'furniture'>('all');
  const [category, setCategory] = useState('');
  const [term, setTerm] = useState('');
  const [open, setOpen] = useState<Product | null>(null);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [panel, setPanel] = useState(false);
  const stock = useAllStock(
    Object.fromEntries(products.flatMap((p) => p.variants.map((v) => [v.id, v.stock]))),
    products.map((p) => p.id).join(','),
  );

  const categories = useMemo(
    () => [...new Set(products.filter((p) => dept === 'all' || p.department === dept).map((p) => p.category))],
    [products, dept],
  );
  const shown = products.filter(
    (p) =>
      (dept === 'all' || p.department === dept) &&
      (!category || p.category === category) &&
      (!term || `${p.name} ${p.category} ${p.materials} ${p.variants.map((v) => v.colour).join(' ')}`.toLowerCase().includes(term.toLowerCase())),
  );
  const count = picks.reduce((n, p) => n + p.qty, 0);

  function pick(product: Product, variant: Variant) {
    setPicks((ps) => {
      const found = ps.find((p) => p.variant.id === variant.id);
      return found ? ps.map((p) => (p.variant.id === variant.id ? { ...p, qty: p.qty + 1 } : p)) : [...ps, { product, variant, qty: 1 }];
    });
  }

  return (
    <div className="pb-28">
      <div className="sticky top-16 z-20 bg-paper/95 backdrop-blur px-4 sm:px-6 py-4 border-b border-stone flex flex-wrap gap-3 items-center">
        <div className="flex gap-1">
          {(['all', 'fashion', 'furniture'] as const).map((d) => (
            <button
              key={d}
              onClick={() => {
                setDept(d);
                setCategory('');
              }}
              className={`h-11 px-5 text-[15px] border ${dept === d ? 'bg-ink text-white border-ink' : 'border-stone'}`}
            >
              {d === 'all' ? 'Everything' : d === 'fashion' ? 'Fashion' : 'Furniture'}
            </button>
          ))}
        </div>
        <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search by name, material or colour" className="field h-11 max-w-[340px]" />
        <div className="flex gap-2 overflow-x-auto no-scrollbar w-full">
          {['', ...categories].map((c) => (
            <button
              key={c || 'all'}
              onClick={() => setCategory(c)}
              className={`shrink-0 h-9 px-4 text-[14px] border ${category === c ? 'border-ink' : 'border-stone text-ash'}`}
            >
              {c || 'All categories'}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 sm:px-6 pt-6 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
        {shown.map((p) => {
          const total = p.variants.reduce((s, v) => s + (stock[v.id] ?? v.stock), 0);
          return (
            <button key={p.id} className="text-left" onClick={() => setOpen(p)}>
              <div className="aspect-[4/5] bg-mist">{p.images[0] && <img src={p.images[0].url} alt="" className="w-full h-full object-cover" loading="lazy" />}</div>
              <p className="mt-2 text-[16px]">{p.name}</p>
              <p className="text-[14px]">{naira(p.price)}</p>
              <p className={`text-[14px] ${p.availability !== 'made_to_order' && total <= 0 ? 'text-alert' : 'text-ash'}`}>
                {p.availability === 'made_to_order' ? 'Made to order' : total > 0 ? `${total} in stock` : 'Sold out'}
              </p>
            </button>
          );
        })}
      </div>

      {open && <Detail product={open} stock={stock} onClose={() => setOpen(null)} onPick={(v) => pick(open, v)} picks={picks} />}

      <button
        onClick={() => setPanel(true)}
        className="fixed bottom-5 right-5 z-30 h-14 px-6 bg-ink text-white text-[15px] disabled:bg-stone disabled:text-ash"
        disabled={count === 0}
      >
        Customer&apos;s selection ({count})
      </button>

      {panel && (
        <Selection
          picks={picks}
          zones={zones}
          setPicks={setPicks}
          onClose={() => setPanel(false)}
          onPlaced={() => {
            setPicks([]);
          }}
        />
      )}
    </div>
  );
}

function Detail({
  product,
  stock,
  onClose,
  onPick,
  picks,
}: {
  product: Product;
  stock: Record<string, number>;
  onClose: () => void;
  onPick: (v: Variant) => void;
  picks: Pick[];
}) {
  const [img, setImg] = useState(0);
  const mto = product.availability === 'made_to_order';
  return (
    <div className="fixed inset-0 z-40 bg-paper overflow-y-auto fade-in" role="dialog" aria-modal="true" aria-label={product.name}>
      <div className="sticky top-0 bg-paper h-16 px-4 sm:px-6 flex items-center justify-between border-b border-stone">
        <span className="text-[14px] text-ash">{product.department === 'fashion' ? 'Fashion' : 'Furniture'} / {product.category}</span>
        <button className="h-11 px-5 border border-ink text-[15px]" onClick={onClose}>Back to all pieces</button>
      </div>
      <div className="grid lg:grid-cols-2 gap-8 p-4 sm:p-6">
        <div>
          <div className="aspect-[4/5] bg-mist">{product.images[img] && <img src={product.images[img].url} alt={product.images[img].alt} className="w-full h-full object-cover" />}</div>
          <div className="mt-3 flex gap-2">
            {product.images.map((im, i) => (
              <button key={i} onClick={() => setImg(i)} className={`w-20 aspect-[4/5] bg-mist border ${i === img ? 'border-ink' : 'border-transparent'}`}>
                <img src={im.url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
        <div>
          <h2 className="display text-[40px] leading-tight">{product.name}</h2>
          <p className="text-[20px] mt-2">{naira(product.price)}</p>
          <p className="mt-5 text-[16px] leading-[1.7] max-w-[60ch]">{product.description}</p>
          {product.department === 'furniture' && (
            <p className="mt-4 text-[15px]">
              {[product.width_cm && `W ${product.width_cm} cm`, product.depth_cm && `D ${product.depth_cm} cm`, product.height_cm && `H ${product.height_cm} cm`].filter(Boolean).join('   ')}
              <span className="block text-ash">{product.materials}</span>
              {mto && <span className="block text-ash">Made to order, about {product.lead_time_weeks} weeks</span>}
            </p>
          )}
          <p className="mt-4 text-[15px] text-ash">{product.details}</p>

          <h3 className="mt-8 text-[15px]">Stock in the store and stockroom</h3>
          <ul className="mt-3 border-t border-stone divide-y divide-stone">
            {product.variants.map((v) => {
              const n = stock[v.id] ?? v.stock;
              const picked = picks.find((p) => p.variant.id === v.id)?.qty ?? 0;
              const canAdd = mto || n - picked > 0;
              return (
                <li key={v.id} className="py-3 flex items-center gap-4 text-[16px]">
                  <span className="flex-1">{[v.size, v.colour].filter(Boolean).join(', ') || 'Standard'}</span>
                  <span className={`text-[14px] ${!mto && n <= 0 ? 'text-alert' : 'text-ash'}`}>{mto ? 'Made to order' : n > 0 ? `${n} available` : 'Sold out'}</span>
                  <button className="h-11 px-4 border border-ink text-[14px] disabled:border-stone disabled:text-ash" disabled={!canAdd} onClick={() => onPick(v)}>
                    {picked ? `Added (${picked})` : 'Add for customer'}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Selection({
  picks,
  zones,
  setPicks,
  onClose,
  onPlaced,
}: {
  picks: Pick[];
  zones: DeliveryZone[];
  setPicks: React.Dispatch<React.SetStateAction<Pick[]>>;
  onClose: () => void;
  onPlaced: () => void;
}) {
  const [fulfilment, setFulfilment] = useState<'in_store' | 'delivery' | 'collection'>('in_store');
  const [zoneId, setZoneId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [placed, setPlaced] = useState<string | null>(null);
  const zone = zones.find((z) => z.id === zoneId) ?? null;
  const totals = computeTotals(
    picks.map((p) => ({ department: p.product.department, price: p.product.price, qty: p.qty })),
    zone,
    fulfilment,
    false,
    0,
  );

  async function place(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError('');
    const res = await fetch('/api/store/showroom-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lines: picks.map((p) => ({ variantId: p.variant.id, qty: p.qty })),
        customer: { name: f.get('name'), phone: f.get('phone'), email: f.get('email') ?? '' },
        fulfilment,
        zoneId: fulfilment === 'delivery' ? zoneId || null : null,
        address: f.get('address') ?? '',
        note: f.get('note') ?? '',
      }),
    });
    const body = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(body.error);
      return;
    }
    setPlaced(body.number);
    onPlaced();
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Customer's selection">
      <button className="absolute inset-0 bg-black/25" onClick={onClose} aria-label="Close" />
      <div className="absolute right-0 top-0 h-full w-full max-w-[520px] bg-paper overflow-y-auto">
        <div className="h-16 px-6 flex items-center justify-between border-b border-stone">
          <h2 className="text-[16px]">Customer&apos;s selection</h2>
          <button className="text-[15px]" onClick={onClose}>Close</button>
        </div>
        {placed ? (
          <div className="p-6">
            <p className="display text-[34px] leading-tight">Order {placed} is at the counter.</p>
            <p className="mt-3 text-[15px] text-ash">
              The pieces are held for this customer. Take payment on the counter screen: the order is listed under “Waiting for payment”.
            </p>
            <button className="btn mt-8" onClick={onClose}>Back to the showroom</button>
          </div>
        ) : (
          <form onSubmit={place} className="p-6 grid gap-5">
            <ul className="divide-y divide-stone border-y border-stone">
              {picks.map((p) => (
                <li key={p.variant.id} className="py-3 flex items-center gap-3 text-[15px]">
                  <span className="flex-1">
                    {p.product.name}
                    <span className="block text-[13px] text-ash">{[p.variant.size, p.variant.colour].filter(Boolean).join(', ')}</span>
                  </span>
                  <span>× {p.qty}</span>
                  <span className="w-28 text-right">{naira(p.product.price * p.qty)}</span>
                  <button type="button" className="text-[13px] text-ash hover:text-alert" onClick={() => setPicks((ps) => ps.filter((x) => x.variant.id !== p.variant.id))}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="sm:col-span-2"><span className="label">Customer name</span><input name="name" required className="field" /></label>
              <label><span className="label">Phone</span><input name="phone" type="tel" required className="field" /></label>
              <label><span className="label">Email (optional)</span><input name="email" type="email" className="field" /></label>
            </div>
            <fieldset>
              <legend className="label">The customer will</legend>
              <div className="grid gap-2">
                {(
                  [
                    ['in_store', 'Pay now and take the pieces today'],
                    ['collection', 'Pay now and collect later'],
                    ['delivery', 'Pay now and have it delivered'],
                  ] as const
                ).map(([v, label]) => (
                  <label key={v} className={`p-3 border text-[15px] cursor-pointer ${fulfilment === v ? 'border-ink bg-white' : 'border-stone'}`}>
                    <input type="radio" className="sr-only" checked={fulfilment === v} onChange={() => setFulfilment(v)} />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
            {fulfilment === 'delivery' && (
              <>
                <label>
                  <span className="label">Delivery area</span>
                  <select className="field" required value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
                    <option value="">Choose an area</option>
                    {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                  </select>
                </label>
                <label><span className="label">Delivery address</span><textarea name="address" required rows={2} className="field" /></label>
              </>
            )}
            <label><span className="label">Note for the team (optional)</span><input name="note" className="field" /></label>
            <dl className="text-[15px] space-y-1">
              <div className="flex justify-between"><dt>Pieces</dt><dd>{naira(totals.subtotal)}</dd></div>
              {fulfilment === 'delivery' && <div className="flex justify-between"><dt>Delivery</dt><dd>{zone ? naira(totals.deliveryFee) : 'Choose an area'}</dd></div>}
              <div className="flex justify-between text-[20px] font-display pt-2"><dt>Total</dt><dd>{naira(totals.total)}</dd></div>
            </dl>
            {error && <p className="text-alert text-[14px]" role="alert">{error}</p>}
            <button className="btn h-14" disabled={busy || picks.length === 0}>{busy ? 'Sending to the counter' : 'Send to the counter for payment'}</button>
          </form>
        )}
      </div>
    </div>
  );
}
