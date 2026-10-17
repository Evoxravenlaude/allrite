'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Product } from '@/lib/types';
import { useShop } from './state';
import { ProductGrid } from './ProductCard';

export default function SavedList() {
  const { saved, signedIn } = useShop();
  const [products, setProducts] = useState<Product[] | null>(null);
  const key = saved.join(',');

  useEffect(() => {
    if (!key) {
      setProducts([]);
      return;
    }
    fetch(`/api/products?ids=${key}`, { cache: 'no-store' })
      .then((r) => r.json())
      .then(setProducts);
  }, [key]);

  // Keep a removed piece on screen until the page is left, so the list does not jump.
  const visible = (products ?? []).filter((p) => saved.includes(p.id));
  const stock = Object.fromEntries(visible.flatMap((p) => p.variants.map((v) => [v.id, v.stock])));

  return (
    <div className="mt-4">
      <p className="text-ash text-[15px] max-w-[60ch]">
        {signedIn
          ? 'Your Saved list is kept in your account, so it is the same on every phone and computer you sign in on.'
          : (
            <>
              Saved pieces are kept on this device.{' '}
              <Link href="/account?next=/saved" className="link text-ink">Sign in or create an account</Link> to keep them on every device.
            </>
          )}
      </p>
      <div className="mt-10">
        {products === null ? (
          <p className="text-ash">Loading your Saved list…</p>
        ) : visible.length === 0 ? (
          <div className="py-10 max-w-[50ch]">
            <p className="display text-[26px]">Nothing saved yet.</p>
            <p className="mt-3 text-ash">Tap the bookmark beside any piece to keep it here for later.</p>
            <div className="mt-8 flex gap-3">
              <Link href="/fashion" className="btn-quiet">Shop fashion</Link>
              <Link href="/furniture" className="btn-quiet">Shop furniture</Link>
            </div>
          </div>
        ) : (
          <ProductGrid products={visible} initialStock={stock} />
        )}
      </div>
    </div>
  );
}
