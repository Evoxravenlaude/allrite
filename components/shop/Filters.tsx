'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';

type Current = Partial<Record<'category' | 'size' | 'colour' | 'min' | 'max' | 'instock' | 'sort' | 'q', string>>;

const PRICES = [
  { label: 'Under ₦150,000', min: '', max: '150000' },
  { label: '₦150,000 to ₦400,000', min: '150000', max: '400000' },
  { label: '₦400,000 to ₦1,500,000', min: '400000', max: '1500000' },
  { label: 'Over ₦1,500,000', min: '1500000', max: '' },
];

export default function Filters({
  categories,
  sizes,
  colours,
  current,
  count,
}: {
  basePath: string;
  categories: string[];
  sizes: string[];
  colours: string[];
  current: Current;
  count: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  const set = (changes: Record<string, string | undefined>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    start(() => router.push(`${pathname}${next.toString() ? `?${next}` : ''}`, { scroll: false }));
  };

  const activeCount = ['size', 'colour', 'min', 'max', 'instock'].filter((k) => current[k as keyof Current]).length;

  return (
    <div className="mt-8 mb-8 sm:mb-10">
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0" role="tablist" aria-label="Categories">
          {['', ...categories].map((c) => {
            const on = (current.category ?? '') === c;
            return (
              <button
                key={c || 'all'}
                role="tab"
                aria-selected={on}
                onClick={() => set({ category: c || undefined })}
                className={`shrink-0 h-9 px-4 text-[13px] border transition-colors ${
                  on ? 'bg-ink text-white border-ink' : 'border-stone hover:border-ink'
                }`}
              >
                {c || 'All'}
              </button>
            );
          })}
        </div>
      )}

      <div className="mt-5 flex items-center justify-between gap-4 text-[14px]">
        <button onClick={() => setOpen((o) => !o)} aria-expanded={open} className="hover:underline underline-offset-4">
          {open ? 'Hide filters' : 'Filter'}
          {activeCount ? ` (${activeCount})` : ''}
        </button>
        <span className={`text-ash ${pending ? 'opacity-50' : ''}`} aria-live="polite">
          {count} {count === 1 ? 'piece' : 'pieces'}
        </span>
        <label className="flex items-center gap-2">
          <span className="text-ash hidden sm:inline">Sort by</span>
          <select
            value={current.sort ?? 'new'}
            onChange={(e) => set({ sort: e.target.value === 'new' ? undefined : e.target.value })}
            className="bg-transparent text-[14px] focus:outline-none cursor-pointer"
          >
            <option value="new">Newest</option>
            <option value="price-asc">Price, low to high</option>
            <option value="price-desc">Price, high to low</option>
            <option value="name">Name</option>
          </select>
        </label>
      </div>

      {open && (
        <div className="mt-5 py-6 border-y border-stone grid gap-8 sm:grid-cols-2 lg:grid-cols-4 text-[14px] fade-in">
          {sizes.length > 0 && (
            <fieldset>
              <legend className="text-ash mb-3">Size</legend>
              <div className="flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => set({ size: current.size === s ? undefined : s })}
                    aria-pressed={current.size === s}
                    className={`min-w-10 h-9 px-3 border text-[13px] ${current.size === s ? 'bg-ink text-white border-ink' : 'border-stone hover:border-ink'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </fieldset>
          )}
          <fieldset>
            <legend className="text-ash mb-3">Colour or finish</legend>
            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
              {colours.map((c) => (
                <label key={c} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="colour" checked={current.colour === c} onChange={() => set({ colour: c })} className="accent-ink" />
                  {c}
                </label>
              ))}
              {current.colour && (
                <button className="text-left link mt-1" onClick={() => set({ colour: undefined })}>
                  Any colour
                </button>
              )}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-ash mb-3">Price</legend>
            <div className="flex flex-col gap-1.5">
              {PRICES.map((p) => {
                const on = (current.min ?? '') === p.min && (current.max ?? '') === p.max;
                return (
                  <label key={p.label} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="price" checked={on} onChange={() => set({ min: p.min || undefined, max: p.max || undefined })} className="accent-ink" />
                    {p.label}
                  </label>
                );
              })}
              {(current.min || current.max) && (
                <button className="text-left link mt-1" onClick={() => set({ min: undefined, max: undefined })}>
                  Any price
                </button>
              )}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-ash mb-3">Availability</legend>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={current.instock === '1'} onChange={(e) => set({ instock: e.target.checked ? '1' : undefined })} className="accent-ink" />
              Hide sold-out pieces
            </label>
            {activeCount > 0 && (
              <button className="link mt-6 block" onClick={() => set({ size: undefined, colour: undefined, min: undefined, max: undefined, instock: undefined })}>
                Clear all filters
              </button>
            )}
          </fieldset>
        </div>
      )}
    </div>
  );
}
