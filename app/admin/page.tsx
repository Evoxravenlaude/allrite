import Link from 'next/link';
import { can, requireStaff } from '@/lib/auth';
import { dailySummary, dashboardCounts, lagosDayRange, lowStock, salesByDay, topProducts } from '@/lib/store';
import { dateOnly, naira } from '@/lib/format';
import SalesChart from '@/components/admin/SalesChart';
import DayPicker from '@/components/admin/DayPicker';

export const metadata = { title: 'Overview' };

export default async function Overview({ searchParams }: { searchParams: Promise<{ day?: string; denied?: string }> }) {
  const staff = await requireStaff();
  const { day, denied } = await searchParams;
  const reports = can(staff.role, 'view_reports');
  const [counts, summary, series, low, top] = await Promise.all([
    dashboardCounts(),
    reports ? dailySummary(day) : null,
    reports ? salesByDay(14) : [],
    lowStock(),
    reports ? topProducts(30) : [],
  ]);
  const today = lagosDayRange().day;
  const filled = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(`${today}T12:00:00+01:00`);
    d.setDate(d.getDate() - (13 - i));
    const iso = d.toISOString().slice(0, 10);
    const found = series.find((s) => s.day === iso);
    return { day: iso, online: found?.online ?? 0, store: found?.store ?? 0 };
  });

  const tasks = [
    { n: counts.new_orders, label: 'online orders to prepare', href: '/admin/orders?status=received' },
    { n: counts.held, label: 'showroom orders waiting at the counter', href: '/store/counter' },
    { n: counts.viewings, label: 'viewing requests to confirm', href: '/admin/viewings' },
    { n: counts.balances_due, label: 'furniture orders with a balance to collect', href: '/admin/orders?status=deposit' },
  ].filter((t) => t.n > 0);

  return (
    <div className="max-w-[1100px]">
      {denied && <p className="mb-6 p-3 border border-alert text-alert text-[14px]">Your account cannot open that page. Ask the store owner if you need access.</p>}
      <h1 className="display text-[36px] leading-none">Overview</h1>
      <p className="mt-2 text-[14px] text-ash">Signed in as {staff.name}.</p>

      <section className="mt-8">
        {tasks.length === 0 ? (
          <p className="text-[15px] text-ash">Nothing is waiting for you right now.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {tasks.map((t) => (
              <li key={t.label}>
                <Link href={t.href} className="flex items-baseline gap-3 p-4 bg-white border border-stone hover:border-ink">
                  <span className="display text-[28px] leading-none">{t.n}</span>
                  <span className="text-[14px]">{t.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {summary && (
        <section className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-[17px]">{summary.day === today ? 'Today' : 'Sales on'} {dateOnly(`${summary.day}T12:00:00+01:00`)}</h2>
              <p className="text-ash text-[13px] mt-0.5">Money received that day, split by how it was paid.</p>
            </div>
            <DayPicker value={summary.day} max={today} />
          </div>
          <div className="mt-5 grid gap-px bg-stone border border-stone sm:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
            <div className="bg-white p-5">
              <p className="text-[13px] text-ash">Total</p>
              <p className="display text-[36px] leading-tight">{naira(summary.total)}</p>
              <p className="text-[13px] text-ash">{summary.orders} orders, {summary.itemsSold} pieces</p>
            </div>
            {(
              [
                ['Counter cash', summary.split.counterCash],
                ['Counter transfer', summary.split.counterTransfer],
                ['Counter card', summary.split.counterCard],
                ['Online', summary.split.online],
              ] as const
            ).map(([label, v]) => (
              <div key={label} className="bg-white p-5">
                <p className="text-[13px] text-ash">{label}</p>
                <p className="text-[20px] mt-1">{naira(v)}</p>
              </div>
            ))}
          </div>
          {summary.balancesCollected > 0 && <p className="mt-2 text-[13px] text-ash">Includes {naira(summary.balancesCollected)} of furniture balances paid online.</p>}
          <div className="mt-4 flex gap-4 text-[13px]">
            <a className="link" href={`/admin/export/sales?from=${summary.day}&to=${summary.day}`}>Download this day as a spreadsheet</a>
            <a className="link" href={`/admin/export/sales?from=${filled[0].day}&to=${today}`}>Download the last 14 days</a>
          </div>
        </section>
      )}

      {reports && (
        <section className="mt-12 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          <div className="bg-white border border-stone p-5">
            <h2 className="text-[15px] mb-4">Last 14 days</h2>
            <SalesChart data={filled} />
          </div>
          <div className="bg-white border border-stone p-5">
            <h2 className="text-[15px] mb-4">Best sellers, last 30 days</h2>
            {top.length === 0 ? (
              <p className="text-[14px] text-ash">No sales yet.</p>
            ) : (
              <ol className="text-[14px] divide-y divide-stone">
                {top.map((t) => (
                  <li key={t.name} className="py-2.5 flex justify-between gap-4">
                    <span>{t.name}<span className="block text-ash text-[13px]">{t.qty} sold</span></span>
                    <span>{naira(t.revenue)}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>
      )}

      <section className="mt-12">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[17px]">Running low</h2>
          <Link href="/admin/stock?low=1" className="link text-[13px]">See all stock</Link>
        </div>
        {low.length === 0 ? (
          <p className="mt-3 text-[14px] text-ash">Every item is above its low-stock level.</p>
        ) : (
          <ul className="mt-4 bg-white border border-stone divide-y divide-stone text-[14px]">
            {low.slice(0, 8).map((v) => (
              <li key={v.id} className="px-4 py-3 flex justify-between gap-4">
                <Link href={`/admin/products/${v.product_id}`} className="hover:underline">
                  {v.name} <span className="text-ash">{[v.size, v.colour].filter(Boolean).join(', ')}</span>
                </Link>
                <span className={v.stock === 0 ? 'text-alert' : 'text-indigo'}>{v.stock === 0 ? 'Sold out' : `${v.stock} left`}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
