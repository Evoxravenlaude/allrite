'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { staffSignOut } from '@/lib/actions/staff';

type Perms = Record<'products' | 'stock' | 'reports' | 'staff' | 'settings' | 'customers', boolean>;

export default function AdminNav({
  name,
  role,
  perms,
  counts,
}: {
  name: string;
  role: string;
  perms: Perms;
  counts: { new_orders: number; held: number; viewings: number; balances_due: number };
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const items: [string, string, boolean, number?][] = [
    ['/admin', 'Overview', true],
    ['/admin/orders', 'Orders', true, counts.new_orders],
    ['/admin/products', 'Products', true],
    ['/admin/stock', 'Stock', perms.stock],
    ['/admin/customers', 'Customers', perms.customers],
    ['/admin/viewings', 'Viewings', true, counts.viewings],
    ['/admin/staff', 'Staff', perms.staff],
    ['/admin/settings', 'Store and delivery', perms.settings],
  ];
  const active = (href: string) => (href === '/admin' ? pathname === href : pathname.startsWith(href));

  return (
    <aside className="no-print bg-white border-b lg:border-b-0 lg:border-r border-stone">
      <div className="lg:sticky lg:top-0 lg:h-svh flex flex-col">
      <div className="h-16 px-5 flex items-center justify-between">
        <Link href="/admin" className="font-display tracking-[0.28em] text-[19px]">ALLRITE</Link>
        <button className="lg:hidden text-[14px]" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          {open ? 'Close' : 'Menu'}
        </button>
      </div>
      <nav className={`${open ? 'block' : 'hidden'} lg:flex flex-col flex-1 px-3 pb-5`} aria-label="Dashboard">
        <ul className="space-y-0.5">
          {items
            .filter(([, , show]) => show)
            .map(([href, label, , badge]) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`h-10 px-3 flex items-center justify-between text-[14px] ${active(href) ? 'bg-ink text-white' : 'hover:bg-mist'}`}
                >
                  {label}
                  {badge ? <span className={`text-[12px] ${active(href) ? 'text-white' : 'text-indigo'}`}>{badge}</span> : null}
                </Link>
              </li>
            ))}
        </ul>
        <div className="mt-6 pt-5 border-t border-stone space-y-0.5 text-[14px]">
          <Link href="/store/showroom" className="h-10 px-3 flex items-center hover:bg-mist">Showroom screen</Link>
          <Link href="/store/counter" className="h-10 px-3 flex items-center justify-between hover:bg-mist">
            Counter screen {counts.held ? <span className="text-[12px] text-indigo">{counts.held} waiting</span> : null}
          </Link>
          <Link href="/" target="_blank" className="h-10 px-3 flex items-center hover:bg-mist">View the shop</Link>
        </div>
        <div className="mt-auto pt-6 px-3 text-[13px]">
          <p>{name}</p>
          {name.toLowerCase() !== role && <p className="text-ash capitalize">{role}</p>}
          <form action={staffSignOut} className="mt-2">
            <button className="link">Sign out</button>
          </form>
        </div>
      </nav>
      </div>
    </aside>
  );
}
