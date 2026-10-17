'use client';

import Link from 'next/link';
import { naira } from '@/lib/format';
import type { Product } from '@/lib/types';
import { useShop, useLiveStock } from './state';

export function stockNote(p: Pick<Product, 'availability' | 'lead_time_weeks'>, total: number) {
  if (p.availability === 'made_to_order') return { text: `Made to order, ${p.lead_time_weeks ?? 6} weeks`, tone: 'quiet' as const };
  if (total <= 0) return { text: 'Sold out', tone: 'quiet' as const };
  if (total <= 2) return { text: `Only ${total} left`, tone: 'accent' as const };
  return null;
}

export function SaveButton({ productId, name, className = '' }: { productId: string; name: string; className?: string }) {
  const { isSaved, toggleSaved } = useShop();
  const saved = isSaved(productId);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        toggleSaved(productId);
      }}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${name} from Saved` : `Save ${name}`}
      className={`p-2 ${className}`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M6 3.5h12v17l-6-4.2-6 4.2z"
          fill={saved ? '#000' : 'none'}
          stroke="#000"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

export function ProductCard({ product, stock, priority }: { product: Product; stock: Record<string, number>; priority?: boolean }) {
  const total = product.variants.reduce((s, v) => s + (stock[v.id] ?? v.stock), 0);
  const note = stockNote(product, total);
  const [first, second] = product.images;
  return (
    <article className="group">
      <Link href={`/product/${product.slug}`} className="block relative aspect-[4/5] bg-mist overflow-hidden" tabIndex={-1} aria-hidden="true">
        {first && (
          <img src={first.url} alt="" loading={priority ? 'eager' : 'lazy'} className="absolute inset-0 w-full h-full object-cover fade-in" />
        )}
        {second && (
          <img
            src={second.url}
            alt=""
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500 hidden md:block"
          />
        )}
      </Link>
      <div className="mt-3 flex items-start gap-2">
        <Link href={`/product/${product.slug}`} className="flex-1 min-w-0 text-[14px] leading-snug">
          <h3 className="group-hover:underline underline-offset-4">{product.name}</h3>
          <p className="text-ash">{naira(product.price)}</p>
          {note && <p className={`mt-0.5 text-[13px] ${note.tone === 'accent' ? 'text-indigo' : 'text-ash'}`}>{note.text}</p>}
        </Link>
        <SaveButton productId={product.id} name={product.name} className="-mr-2 -mt-2" />
      </div>
    </article>
  );
}

export function ProductGrid({
  products,
  initialStock,
  variant = 'fashion',
}: {
  products: Product[];
  initialStock: Record<string, number>;
  variant?: 'fashion' | 'furniture';
}) {
  const stock = useLiveStock(
    products.map((p) => p.id),
    initialStock,
  );
  if (!products.length) return null;
  return (
    <div
      className={
        variant === 'furniture'
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 sm:gap-x-6 gap-y-12'
          : 'grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-3 sm:gap-x-6 gap-y-10 sm:gap-y-14'
      }
    >
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} stock={stock} priority={i < 4} />
      ))}
    </div>
  );
}
