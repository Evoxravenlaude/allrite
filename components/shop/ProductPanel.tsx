'use client';

import { useMemo, useState } from 'react';
import { naira } from '@/lib/format';
import type { Product } from '@/lib/types';
import { useLiveStock, useShop } from './state';
import { SaveButton, stockNote } from './ProductCard';
import ViewingForm from './ViewingForm';

export default function ProductPanel({
  product,
  settings,
}: {
  product: Product;
  settings: { depositPercent: number; whatsapp: string };
}) {
  const { add, lines, setBagOpen } = useShop();
  const stock = useLiveStock(
    [product.id],
    Object.fromEntries(product.variants.map((v) => [v.id, v.stock])),
    3000,
  );
  const madeToOrder = product.availability === 'made_to_order';
  const isFurniture = product.department === 'furniture';
  const colours = useMemo(() => [...new Set(product.variants.map((v) => v.colour).filter(Boolean))], [product.variants]);
  const hasSizes = product.variants.some((v) => v.size && v.size !== 'One size');
  const firstAvailable = product.variants.find((v) => madeToOrder || (stock[v.id] ?? v.stock) > 0) ?? product.variants[0];
  const [colour, setColour] = useState(firstAvailable?.colour ?? '');
  const [variantId, setVariantId] = useState<string | null>(hasSizes ? null : firstAvailable?.id ?? null);
  const [added, setAdded] = useState(false);
  const [viewing, setViewing] = useState(false);

  const forColour = product.variants.filter((v) => !colours.length || v.colour === colour);
  const selected = product.variants.find((v) => v.id === variantId) ?? null;
  const left = selected ? stock[selected.id] ?? selected.stock : 0;
  const inBag = selected ? lines.find((l) => l.variantId === selected.id)?.qty ?? 0 : 0;
  const total = product.variants.reduce((s, v) => s + (stock[v.id] ?? v.stock), 0);
  const note = stockNote(product, total);

  let action = 'Add to bag';
  let disabled = false;
  if (!selected) {
    action = hasSizes ? 'Choose a size' : 'Choose a finish';
    disabled = true;
  } else if (!madeToOrder && left <= 0) {
    action = 'Sold out';
    disabled = true;
  } else if (!madeToOrder && inBag >= left) {
    action = 'All available pieces are in your bag';
    disabled = true;
  }

  const onAdd = () => {
    if (!selected) return;
    add(selected.id, 1);
    setAdded(true);
    setBagOpen(true);
    window.setTimeout(() => setAdded(false), 2500);
  };

  const dims = [
    product.width_cm && `Width ${product.width_cm} cm`,
    product.depth_cm && `Depth ${product.depth_cm} cm`,
    product.height_cm && `Height ${product.height_cm} cm`,
  ].filter(Boolean);

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <h1 className="display text-[32px] sm:text-[40px] leading-[1.05]">{product.name}</h1>
        <SaveButton productId={product.id} name={product.name} className="-mr-2 mt-1" />
      </div>
      <p className="mt-3 text-[17px]">{naira(product.price)}</p>
      {note && <p className={`mt-1 text-[14px] ${note.tone === 'accent' ? 'text-indigo' : 'text-ash'}`}>{note.text}</p>}
      {isFurniture && product.allow_deposit && (
        <p className="mt-1 text-[14px] text-ash">
          Reserve it with a {settings.depositPercent}% deposit of {naira(Math.round((product.price * settings.depositPercent) / 100))}. Pay the balance before delivery.
        </p>
      )}

      <p className="mt-6 text-[15px] leading-[1.7] max-w-[56ch]">{product.description}</p>

      {colours.length > 1 && (
        <fieldset className="mt-8">
          <legend className="text-[13px] text-ash mb-2">
            {isFurniture ? 'Finish' : 'Colour'}: <span className="text-ink">{colour}</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {colours.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setColour(c);
                  const match = product.variants.filter((v) => v.colour === c);
                  setVariantId(hasSizes ? null : match[0]?.id ?? null);
                }}
                aria-pressed={c === colour}
                className={`h-10 px-4 border text-[14px] ${c === colour ? 'border-ink' : 'border-stone hover:border-ash'}`}
              >
                {c}
              </button>
            ))}
          </div>
        </fieldset>
      )}
      {colours.length === 1 && <p className="mt-8 text-[13px] text-ash">{isFurniture ? 'Finish' : 'Colour'}: <span className="text-ink">{colours[0]}</span></p>}

      {hasSizes && (
        <fieldset className="mt-6">
          <legend className="text-[13px] text-ash mb-2">Size</legend>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
            {forColour.map((v) => {
              const n = stock[v.id] ?? v.stock;
              const out = !madeToOrder && n <= 0;
              const on = v.id === variantId;
              return (
                <button
                  key={v.id}
                  onClick={() => setVariantId(v.id)}
                  disabled={out}
                  aria-pressed={on}
                  aria-label={`${v.size}${out ? ', sold out' : n <= 2 && !madeToOrder ? `, only ${n} left` : ''}`}
                  className={`h-11 border text-[14px] relative ${
                    on ? 'bg-ink text-white border-ink' : out ? 'border-stone text-ash line-through cursor-not-allowed' : 'border-stone hover:border-ink'
                  }`}
                >
                  {v.size}
                </button>
              );
            })}
          </div>
          {selected && !madeToOrder && left > 0 && left <= 2 && (
            <p className="mt-2 text-[13px] text-indigo">Only {left} left in this size.</p>
          )}
        </fieldset>
      )}

      <div className="mt-8 flex gap-3">
        <button className="btn flex-1" disabled={disabled} onClick={onAdd}>
          {added ? 'Added to your bag' : action}
        </button>
      </div>
      {madeToOrder && (
        <p className="mt-3 text-[13px] text-ash">
          Made to order. Ready about {product.lead_time_weeks ?? 6} weeks after your order is confirmed.
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[14px]">
        <a
          className="link"
          target="_blank"
          rel="noreferrer"
          href={`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(`Hello Allrite, I have a question about the ${product.name}.`)}`}
        >
          Ask about this piece on WhatsApp
        </a>
        {isFurniture && (
          <button className="link" onClick={() => setViewing((v) => !v)} aria-expanded={viewing}>
            Book a viewing in the store
          </button>
        )}
      </div>
      {viewing && <ViewingForm productId={product.id} productName={product.name} onDone={() => undefined} />}

      <div className="mt-10 border-t border-stone text-[14px]">
        {isFurniture && dims.length > 0 && (
          <details className="border-b border-stone group" open>
            <summary className="py-4 cursor-pointer list-none flex justify-between">
              Dimensions and materials <span className="group-open:rotate-45 transition-transform">+</span>
            </summary>
            <div className="pb-5 space-y-1">
              {dims.map((d) => (
                <p key={d as string}>{d}</p>
              ))}
              {product.materials && <p className="pt-2">Materials: {product.materials}</p>}
              {product.finishes && <p>Finishes available: {product.finishes}</p>}
            </div>
          </details>
        )}
        <details className="border-b border-stone group" open={!isFurniture}>
          <summary className="py-4 cursor-pointer list-none flex justify-between">
            {isFurniture ? 'Details' : 'Fabric and fit'} <span className="group-open:rotate-45 transition-transform">+</span>
          </summary>
          <p className="pb-5 leading-[1.7]">{product.details}</p>
        </details>
        <details className="border-b border-stone group">
          <summary className="py-4 cursor-pointer list-none flex justify-between">
            Care <span className="group-open:rotate-45 transition-transform">+</span>
          </summary>
          <p className="pb-5 leading-[1.7]">{product.care}</p>
        </details>
        <details className="border-b border-stone group">
          <summary className="py-4 cursor-pointer list-none flex justify-between">
            Delivery and returns <span className="group-open:rotate-45 transition-transform">+</span>
          </summary>
          <div className="pb-5 leading-[1.7] space-y-2">
            <p>
              {isFurniture
                ? 'Furniture is delivered and placed in the room of your choice by our own team. Delivery prices by area are shown at checkout.'
                : 'Delivery prices by area are shown at checkout. You can also collect from the store at no charge.'}
            </p>
            <p>
              <a href="/returns" className="link">
                Read our returns and exchange rules
              </a>
            </p>
          </div>
        </details>
      </div>
    </div>
  );
}
