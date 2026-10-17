'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { staffSignOut } from '@/lib/actions/staff';

export default function StoreNav({ name, canAdmin }: { name: string; canAdmin: boolean }) {
  const pathname = usePathname();
  if (pathname.startsWith('/store/receipt')) return null;
  const tab = (href: string, label: string) => (
    <Link
      href={href}
      className={`h-10 px-5 flex items-center text-[15px] ${pathname.startsWith(href) ? 'bg-ink text-white' : 'hover:bg-white'}`}
    >
      {label}
    </Link>
  );
  return (
    <header className="no-print h-16 px-4 sm:px-6 flex items-center gap-4 sm:gap-6 bg-paper border-b border-stone sticky top-0 z-30">
      <span className="font-display tracking-[0.28em] text-[20px]">ALLRITE</span>
      <nav className="flex gap-1">
        {tab('/store/showroom', 'Showroom')}
        {tab('/store/counter', 'Counter')}
        {canAdmin && tab('/admin', 'Dashboard')}
      </nav>
      <div className="ml-auto flex items-center gap-4 text-[14px]">
        <span className="text-ash hidden sm:inline">{name}</span>
        <form action={staffSignOut}>
          <button className="hover:underline">Sign out</button>
        </form>
      </div>
    </header>
  );
}
