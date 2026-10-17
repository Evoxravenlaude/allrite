'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { restockAction, setStockAction } from '@/lib/actions/admin';
import { naira } from '@/lib/format';

type Row = { id: string; product_id: string; name: string; department: string; category: string; size: string; colour: string; barcode: string; stock: number; low_stock_at: number; price: number };

export default function StockTable({ rows, lowOnly }: { rows: Row[]; lowOnly: boolean }) {
  const [term, setTerm] = useState('');
  const [low, setLow] = useState(lowOnly);
  const shown = rows.filter(
    (r) => (!low || r.stock <= r.low_stock_at) && (!term || `${r.name} ${r.size} ${r.colour} ${r.barcode}`.toLowerCase().includes(term.toLowerCase())),
  );
  return (
    <>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search, or scan a barcode" className="field h-10 max-w-[320px]" />
        <label className="flex items-center gap-2 text-[14px]">
          <input type="checkbox" checked={low} onChange={(e) => setLow(e.target.checked)} className="accent-ink" /> Only items running low
        </label>
        <span className="text-[13px] text-ash">{shown.length} rows</span>
      </div>
      <div className="mt-4 bg-white border border-stone overflow-x-auto">
        <table className="w-full min-w-[820px] text-[14px]">
          <thead className="text-left text-ash text-[13px]">
            <tr className="border-b border-stone">
              <th className="font-normal px-4 py-3">Item</th>
              <th className="font-normal px-4 py-3">Barcode</th>
              <th className="font-normal px-4 py-3 text-right">Price</th>
              <th className="font-normal px-4 py-3 text-right">In stock</th>
              <th className="font-normal px-4 py-3">Change</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone">
            {shown.map((r) => <StockRow key={r.id} row={r} />)}
          </tbody>
        </table>
      </div>
    </>
  );
}

function StockRow({ row }: { row: Row }) {
  const router = useRouter();
  const [qty, setQty] = useState('');
  const [msg, setMsg] = useState<{ text: string; error?: boolean } | null>(null);
  const [pending, start] = useTransition();
  const n = Number(qty);
  const run = (fn: () => ReturnType<typeof restockAction>) =>
    start(async () => {
      const r = await fn();
      setMsg({ text: r.error ?? r.ok ?? '', error: !!r.error });
      if (!r.error) {
        setQty('');
        router.refresh();
      }
    });
  return (
    <tr>
      <td className="px-4 py-3">
        <Link href={`/admin/products/${row.product_id}`} className="hover:underline">{row.name}</Link>
        <span className="block text-[13px] text-ash">{[row.size, row.colour].filter(Boolean).join(', ')}</span>
      </td>
      <td className="px-4 py-3 text-ash tabular-nums">{row.barcode}</td>
      <td className="px-4 py-3 text-right">{naira(row.price)}</td>
      <td className={`px-4 py-3 text-right text-[16px] ${row.stock === 0 ? 'text-alert' : row.stock <= row.low_stock_at ? 'text-indigo' : ''}`}>{row.stock}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} className="field h-9 w-20" aria-label={`Quantity for ${row.name}`} />
          <button className="btn-quiet btn-sm" disabled={pending || !qty || !(n > 0)} onClick={() => run(() => restockAction(row.id, n))}>Add</button>
          <button className="btn-quiet btn-sm" disabled={pending || qty === '' || n < 0} onClick={() => run(() => setStockAction(row.id, row.stock, n))}>Set count</button>
        </div>
        {msg && <p className={`mt-1 text-[12px] ${msg.error ? 'text-alert' : 'text-ash'}`}>{msg.text}</p>}
      </td>
    </tr>
  );
}
