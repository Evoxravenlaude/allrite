import Link from 'next/link';
import { notFound } from 'next/navigation';
import { can, requireStaff } from '@/lib/auth';
import CustomerPassword from '@/components/admin/CustomerPassword';
import { customerHistory, getCustomer } from '@/lib/store';
import { CHANNEL_LABEL, dateOnly, naira, statusLabel } from '@/lib/format';

export const metadata = { title: 'Customer' };

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff('view_customers');
  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) notFound();
  const orders = await customerHistory(id);
  const paid = orders.filter((o) => o.payment_status !== 'unpaid' && o.status !== 'cancelled');
  const spent = paid.reduce((s, o) => s + o.amount_paid, 0);
  const pieces = paid.flatMap((o) => o.items);
  return (
    <div className="max-w-[1000px]">
      <Link href="/admin/customers" className="text-[13px] text-ash hover:underline">All customers</Link>
      <h1 className="display text-[36px] leading-none mt-2">{customer.name || customer.email}</h1>
      <p className="mt-2 text-[14px]">
        {customer.email}{customer.phone && <>, <a className="link" href={`tel:${customer.phone}`}>{customer.phone}</a></>}
      </p>
      <p className="text-[13px] text-ash">Customer since {dateOnly(customer.created_at)}. {paid.length} paid orders, {naira(spent)} in total.</p>
      {pieces.length > 0 && (
        <p className="mt-4 text-[14px] max-w-[70ch]">
          <span className="text-ash">Has bought: </span>
          {[...new Set(pieces.map((i) => [i.name, i.size].filter(Boolean).join(', size ')))].join('; ')}
        </p>
      )}
      <ul className="mt-8 bg-white border border-stone divide-y divide-stone text-[14px]">
        {orders.map((o) => (
          <li key={o.id}>
            <Link href={`/admin/orders/${o.id}`} className="px-4 py-3 grid grid-cols-[7rem_1fr_auto] gap-4 hover:bg-paper">
              <span>{o.number}</span>
              <span className="truncate">{o.items.map((i) => i.name).join(', ')}<span className="block text-ash text-[12px]">{CHANNEL_LABEL[o.channel]}, {dateOnly(o.created_at)}, {statusLabel(o.status, o.fulfilment).toLowerCase()}</span></span>
              <span>{naira(o.total)}</span>
            </Link>
          </li>
        ))}
      </ul>
      {can(staff.role, 'discount') && <CustomerPassword customerId={customer.id} />}
    </div>
  );
}
