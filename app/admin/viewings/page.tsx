import { requireStaff } from '@/lib/auth';
import { listViewings } from '@/lib/store';
import { dateTime } from '@/lib/format';
import ViewingStatus from '@/components/admin/ViewingStatus';

export const metadata = { title: 'Viewings' };

const LABEL: Record<string, string> = { requested: 'To confirm', confirmed: 'Confirmed', done: 'Took place', cancelled: 'Cancelled' };

export default async function Viewings() {
  await requireStaff('manage_orders');
  const viewings = await listViewings();
  return (
    <div className="max-w-[1100px]">
      <h1 className="display text-[36px] leading-none">Viewings</h1>
      <p className="mt-3 text-[14px] text-ash max-w-[70ch]">Customers request these from furniture pages. Call or WhatsApp the customer to confirm the time, then mark it confirmed.</p>
      {viewings.length === 0 ? (
        <p className="mt-10 text-[15px] text-ash">No viewing requests yet.</p>
      ) : (
        <ul className="mt-6 bg-white border border-stone divide-y divide-stone text-[14px]">
          {viewings.map((v) => (
            <li key={v.id as string} className="px-4 py-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] items-start">
              <div>
                <p>{v.product_name as string}</p>
                <p className="text-ash">{dateTime(v.preferred_at as string)}</p>
                {v.note ? <p className="mt-1 text-[13px]">“{v.note as string}”</p> : null}
              </div>
              <div>
                <p>{v.name as string}</p>
                <p>
                  <a className="link" href={`tel:${v.phone}`}>{v.phone as string}</a>{' '}
                  <a className="link ml-2" target="_blank" rel="noreferrer" href={`https://wa.me/${String(v.phone).replace(/\D/g, '').replace(/^0/, '234')}`}>WhatsApp</a>
                </p>
                {v.email ? <p className="text-ash">{v.email as string}</p> : null}
              </div>
              <ViewingStatus id={v.id as string} status={v.status as string} labels={LABEL} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
