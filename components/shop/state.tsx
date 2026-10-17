'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { CartLine } from '@/lib/types';

type ShopState = {
  lines: CartLine[];
  count: number;
  add: (variantId: string, qty?: number) => void;
  setQty: (variantId: string, qty: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
  bagOpen: boolean;
  setBagOpen: (open: boolean) => void;
  saved: string[];
  isSaved: (productId: string) => boolean;
  toggleSaved: (productId: string) => void;
  signedIn: boolean;
  whatsappTopic: string | null;
  setWhatsappTopic: (topic: string | null) => void;
};

const Ctx = createContext<ShopState | null>(null);

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: the bag still works for this visit */
  }
}

export function ShopProvider({
  children,
  signedIn,
  initialSaved,
}: {
  children: React.ReactNode;
  signedIn: boolean;
  initialSaved: string[] | null;
}) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [saved, setSaved] = useState<string[]>(initialSaved ?? []);
  const [bagOpen, setBagOpen] = useState(false);
  const [whatsappTopic, setWhatsappTopic] = useState<string | null>(null);
  const loaded = useRef(false);

  useEffect(() => {
    setLines(readLocal<CartLine[]>('allrite-bag', []));
    if (!signedIn) setSaved(readLocal<string[]>('allrite-saved', []));
    else {
      // Bring across anything saved before signing in.
      const local = readLocal<string[]>('allrite-saved', []);
      const missing = local.filter((id) => !(initialSaved ?? []).includes(id));
      if (missing.length) {
        Promise.all(
          missing.map((productId) =>
            fetch('/api/saved', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId, saved: true }) }),
          ),
        ).then(() => {
          setSaved((s) => [...new Set([...missing, ...s])]);
          writeLocal('allrite-saved', []);
        });
      }
    }
    loaded.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (loaded.current) writeLocal('allrite-bag', lines);
  }, [lines]);

  useEffect(() => {
    if (loaded.current && !signedIn) writeLocal('allrite-saved', saved);
  }, [saved, signedIn]);

  const add = useCallback((variantId: string, qty = 1) => {
    setLines((ls) => {
      const found = ls.find((l) => l.variantId === variantId);
      if (found) return ls.map((l) => (l.variantId === variantId ? { ...l, qty: l.qty + qty } : l));
      return [...ls, { variantId, qty }];
    });
  }, []);

  const setQty = useCallback((variantId: string, qty: number) => {
    setLines((ls) => (qty <= 0 ? ls.filter((l) => l.variantId !== variantId) : ls.map((l) => (l.variantId === variantId ? { ...l, qty } : l))));
  }, []);

  const remove = useCallback((variantId: string) => setLines((ls) => ls.filter((l) => l.variantId !== variantId)), []);
  const clear = useCallback(() => setLines([]), []);

  const toggleSaved = useCallback(
    (productId: string) => {
      setSaved((s) => {
        const next = s.includes(productId) ? s.filter((id) => id !== productId) : [productId, ...s];
        if (signedIn) {
          fetch('/api/saved', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, saved: !s.includes(productId) }),
          });
        }
        return next;
      });
    },
    [signedIn],
  );

  const value = useMemo<ShopState>(
    () => ({
      lines,
      count: lines.reduce((n, l) => n + l.qty, 0),
      add,
      setQty,
      remove,
      clear,
      bagOpen,
      setBagOpen,
      saved,
      isSaved: (id) => saved.includes(id),
      toggleSaved,
      signedIn,
      whatsappTopic,
      setWhatsappTopic,
    }),
    [lines, add, setQty, remove, clear, bagOpen, saved, toggleSaved, signedIn, whatsappTopic],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useShop() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useShop must be used inside ShopProvider');
  return ctx;
}

/** Polls live stock so every screen shows the same counts within a few seconds. */
export function useLiveStock(productIds: string[], initial: Record<string, number>, intervalMs = 4000) {
  const [stock, setStock] = useState(initial);
  const key = productIds.join(',');
  useEffect(() => {
    if (!key) return;
    let stopped = false;
    const tick = async () => {
      if (document.hidden) return;
      try {
        const res = await fetch(`/api/stock?products=${key}`, { cache: 'no-store' });
        if (res.ok && !stopped) setStock(await res.json());
      } catch {
        /* offline for a moment; try again on the next tick */
      }
    };
    const id = window.setInterval(tick, intervalMs);
    return () => {
      stopped = true;
      window.clearInterval(id);
    };
  }, [key, intervalMs]);
  return stock;
}
