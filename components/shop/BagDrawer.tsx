'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useShop } from './state';
import { naira } from '@/lib/format';

export type BagVariant = {
  id: string;
  product_name: string;
  product_slug: string;
  size: string;
  colour: string;
  price: number;
  stock: number;
  image: string | null;
  department: 'fashion' | 'furniture';
  availability: 'ready' | 'made_to_order';
  allow_deposit?: boolean;
};

export function useBagVariants(ids: string[]) {
  const [variants, setVariants] = useState<Record<string, BagVariant>>({});
  const [loading, setLoading] = useState(false);
  const key = [...ids].sort().join(',');
  useEffect(() => {
    if (!key) {
      setVariants({});
      return;
    }
    setLoading(true);
    fetch(`/api/variants?ids=${key}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then((list: BagVariant[]) => setVariants(Object.fromEntries(list.map((v) => [v.id, v]))))
      .finally(() => setLoading(false));
  }, [key]);
  return { variants, loading };
}

export function maxQty(v: BagVariant) {
  return v.availability === 'made_to_order' ? 10 : v.stock;
}

export default function BagDrawer() {
  const { lines, bagOpen, setBagOpen, setQty, remove } = useShop();
  const { variants } = useBagVariants(bagOpen ? lines.map((l) => l.variantId) : []);

  useEffect(() => {
    if (!bagOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setBagOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [bagOpen, setBagOpen]);

  if (!bagOpen) return null;
  const known = lines.filter((l) => variants[l.variantId]);
  const subtotal = known.reduce((s, l) => s + variants[l.variantId].price * l.qty, 0);
  const problems = known.filter((l) => l.qty > maxQty(variants[l.variantId]));

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Shopping bag">
      <button className="absolute inset-0 bg-black/25 fade-in" onClick={() => setBagOpen(false)} aria-label="Close bag" />
      <div className="absolute right-0 top-0 h-full w-full max-w-[440px] bg-paper flex flex-col shadow-[0_0_0_1px_#DCD9D2]">
        <div className="h-16 px-6 flex items-center justify-between">
          <h2 className="text-[15px]">Your bag</h2>
          <button onClick={() => setBagOpen(false)} className="text-[14px] hover:underline">
            Close
          </button>
        </div>
        {lines.length === 0 ? (
          <div className="px-6 py-10">
            <p className="display text-[28px] leading-tight">Your bag is empty.</p>
            <p className="mt-3 text-ash">Pieces you add will wait here while you keep browsing.</p>
            <div className="mt-8 flex gap-3">
              <Link href="/fashion" className="btn-quiet btn-sm" onClick={() => setBagOpen(false)}>Shop fashion</Link>
              <Link href="/furniture" className="btn-quiet btn-sm" onClick={() => setBagOpen(false)}>Shop furniture</Link>
            </div>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto px-6 divide-y divide-stone">
              {lines.map((l) => {
                const v = variants[l.variantId];
                if (!v) return <li key={l.variantId} className="py-5 text-ash">Loading…</li>;
                const max = maxQty(v);
                return (
                  <li key={l.variantId} className="py-5 flex gap-4">
                    <Link href={`/product/${v.product_slug}`} onClick={() => setBagOpen(false)} className="w-20 shrink-0 aspect-[4/5] bg-mist">
                      {v.image && <img src={v.image} alt="" className="w-full h-full object-cover" />}
                    </Link>
                    <div className="flex-1 min-w-0 text-[14px]">
                      <div className="flex justify-between gap-3">
                        <Link href={`/product/${v.product_slug}`} onClick={() => setBagOpen(false)} className="hover:underline">
                          {v.product_name}
                        </Link>
                        <span>{naira(v.price * l.qty)}</span>
                      </div>
                      <p className="text-ash">{[v.size, v.colour].filter(Boolean).join(', ')}</p>
                      {v.availability === 'made_to_order' && <p className="text-ash">Made to order</p>}
                      {max === 0 ? (
                        <p className="text-alert mt-1">Sold out. Remove it to continue.</p>
                      ) : l.qty > max ? (
                        <p className="text-alert mt-1">Only {max} left. Lower the quantity to continue.</p>
                      ) : null}
                      <div className="mt-3 flex items-center gap-4">
                        <div className="flex items-center border border-stone">
                          <button className="w-8 h-8" onClick={() => setQty(l.variantId, l.qty - 1)} aria-label="One fewer">−</button>
                          <span className="w-6 text-center" aria-live="polite">{l.qty}</span>
                          <button className="w-8 h-8 disabled:text-stone" disabled={l.qty >= max} onClick={() => setQty(l.variantId, l.qty + 1)} aria-label="One more">+</button>
                        </div>
                        <button className="text-ash hover:text-ink hover:underline" onClick={() => remove(l.variantId)}>
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="px-6 py-6 border-t border-stone">
              <div className="flex justify-between text-[15px]">
                <span>Subtotal</span>
                <span>{naira(subtotal)}</span>
              </div>
              <p className="text-ash text-[13px] mt-1">Delivery is worked out at checkout. Collection from the store is free.</p>
              {problems.length > 0 ? (
                <button className="btn w-full mt-5" disabled>Update your bag to continue</button>
              ) : (
                <Link href="/checkout" className="btn w-full mt-5" onClick={() => setBagOpen(false)}>
                  Go to checkout
                </Link>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
