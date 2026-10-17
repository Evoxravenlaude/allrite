'use client';

import { useState } from 'react';
import { naira } from '@/lib/format';

type Day = { day: string; online: number; store: number };

// Validated with the dataviz palette checker (lightness, chroma, colour-blind separation, contrast).
const ONLINE = '#3E55A8';
const STORE = '#C07A3A';

const short = (iso: string) => new Date(`${iso}T12:00:00+01:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

function niceMax(v: number) {
  if (v <= 0) return 100000;
  const mag = 10 ** Math.floor(Math.log10(v));
  return Math.ceil(v / mag) * mag;
}

function compact(v: number) {
  if (v >= 1_000_000) return `₦${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}m`;
  if (v >= 1000) return `₦${Math.round(v / 1000)}k`;
  return `₦${v}`;
}

export default function SalesChart({ data }: { data: Day[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const W = 720, H = 240, L = 52, B = 28, T = 8;
  const max = niceMax(Math.max(...data.map((d) => d.online + d.store)));
  const slot = (W - L) / data.length;
  const bw = Math.min(28, slot * 0.62);
  const y = (v: number) => T + (H - B - T) * (1 - v / max);
  const ticks = [0, max / 2, max];
  const totalOnline = data.reduce((s, d) => s + d.online, 0);
  const totalStore = data.reduce((s, d) => s + d.store, 0);

  return (
    <figure>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px]">
        <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-[2px]" style={{ background: ONLINE }} />Online {naira(totalOnline)}</span>
        <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-[2px]" style={{ background: STORE }} />In store {naira(totalStore)}</span>
        <button className="ml-auto link text-ash" onClick={() => setTable((t) => !t)}>{table ? 'Show as a chart' : 'Show as a table'}</button>
      </div>
      {table ? (
        <table className="mt-4 w-full text-[13px]">
          <thead><tr className="text-left text-ash"><th className="font-normal py-1.5">Day</th><th className="font-normal text-right">Online</th><th className="font-normal text-right">In store</th><th className="font-normal text-right">Total</th></tr></thead>
          <tbody className="divide-y divide-stone">
            {data.map((d) => (
              <tr key={d.day}><td className="py-1.5">{short(d.day)}</td><td className="text-right">{naira(d.online)}</td><td className="text-right">{naira(d.store)}</td><td className="text-right">{naira(d.online + d.store)}</td></tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="relative mt-4">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Sales per day for the last 14 days, online and in store">
            {ticks.map((t) => (
              <g key={t}>
                <line x1={L} x2={W} y1={y(t)} y2={y(t)} stroke="#ECEBE7" />
                <text x={L - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#6E6B65">{compact(t)}</text>
              </g>
            ))}
            {data.map((d, i) => {
              const x = L + i * slot + (slot - bw) / 2;
              const storeTop = y(d.store);
              const onlineTop = y(d.store + d.online);
              const gap = d.store > 0 && d.online > 0 ? 2 : 0;
              const showLabel = i % 2 === data.length % 2 || data.length <= 8;
              return (
                <g key={d.day} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                  <rect x={L + i * slot} y={T} width={slot} height={H - B - T} fill={hover === i ? '#F6F6F3' : 'transparent'} />
                  {d.store > 0 && <path d={bar(x, storeTop, bw, y(0) - storeTop, d.online === 0)} fill={STORE} />}
                  {d.online > 0 && <path d={bar(x, onlineTop, bw, storeTop - onlineTop - gap, true)} fill={ONLINE} />}
                  {showLabel && <text x={x + bw / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="#6E6B65">{short(d.day)}</text>}
                </g>
              );
            })}
            <line x1={L} x2={W} y1={y(0)} y2={y(0)} stroke="#B9B5AD" />
          </svg>
          {hover !== null && (
            <div
              className="absolute top-0 pointer-events-none bg-white border border-stone px-3 py-2 text-[12px] shadow-sm"
              style={{ left: `min(calc(${((L + hover * slot + slot / 2) / W) * 100}% + 12px), calc(100% - 170px))` }}
            >
              <p className="text-ash">{short(data[hover].day)}</p>
              <p className="flex justify-between gap-4"><span>Online</span><span>{naira(data[hover].online)}</span></p>
              <p className="flex justify-between gap-4"><span>In store</span><span>{naira(data[hover].store)}</span></p>
              <p className="flex justify-between gap-4 mt-1"><span>Total</span><span>{naira(data[hover].online + data[hover].store)}</span></p>
            </div>
          )}
        </div>
      )}
    </figure>
  );
}

/** A bar with 4px rounded top corners when it is the top segment, square otherwise. */
function bar(x: number, y: number, w: number, h: number, roundTop: boolean) {
  if (h <= 0) return '';
  const r = roundTop ? Math.min(4, h, w / 2) : 0;
  return `M${x} ${y + h}V${y + r}Q${x} ${y} ${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h}Z`;
}
