'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useShop } from './state';

const NAV = [
  { href: '/fashion', label: 'Fashion' },
  { href: '/furniture', label: 'Furniture' },
  { href: '/new-arrivals', label: 'New arrivals' },
];

export function Wordmark({ className = '' }: { className?: string }) {
  return <span className={`font-display tracking-[0.28em] ${className}`}>ALLRITE</span>;
}

export default function Header() {
  const { count, saved, setBagOpen } = useShop();
  const pathname = usePathname();
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [term, setTerm] = useState('');

  useEffect(() => {
    setMenu(false);
    setSearch(false);
  }, [pathname]);

  const active = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <header className="sticky top-0 z-40 bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/85">
      <div className="page-x mx-auto max-w-page h-16 flex items-center gap-6">
        <button className="lg:hidden -ml-1 p-1 text-[14px]" onClick={() => setMenu(true)} aria-label="Open menu">
          Menu
        </button>
        <Link href="/" className="text-[20px] sm:text-[22px] lg:mr-6" aria-label="Allrite home">
          <Wordmark />
        </Link>
        <nav className="hidden lg:flex items-center gap-7 text-[14px]" aria-label="Departments">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={active(n.href) ? 'underline underline-offset-[6px]' : 'hover:underline underline-offset-[6px]'}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-4 sm:gap-6 text-[14px]">
          <button onClick={() => setSearch((s) => !s)} aria-expanded={search} className="hover:underline underline-offset-[6px]">
            Search
          </button>
          <Link href="/saved" className="hidden sm:inline hover:underline underline-offset-[6px]">
            Saved{saved.length ? ` (${saved.length})` : ''}
          </Link>
          <Link href="/account" className="hidden sm:inline hover:underline underline-offset-[6px]">
            Account
          </Link>
          <button onClick={() => setBagOpen(true)} className="hover:underline underline-offset-[6px]">
            Bag ({count})
          </button>
        </div>
      </div>

      {search && (
        <div className="page-x mx-auto max-w-page pb-5 fade-in">
          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              if (term.trim()) router.push(`/search?q=${encodeURIComponent(term.trim())}`);
            }}
            className="flex items-end gap-4 border-b border-ink"
          >
            <label htmlFor="site-search" className="sr-only">
              Search the shop
            </label>
            <input
              id="site-search"
              autoFocus
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search for a dress, a chair, a colour"
              className="flex-1 bg-transparent h-12 text-[18px] sm:text-[22px] font-display placeholder:text-ash focus:outline-none"
            />
            <button className="h-12 text-[14px]">Search</button>
          </form>
        </div>
      )}

      {menu && (
        <div className="fixed inset-0 z-50 bg-paper fade-in lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="page-x h-16 flex items-center justify-between">
            <Wordmark className="text-[20px]" />
            <button onClick={() => setMenu(false)} className="text-[14px]">
              Close
            </button>
          </div>
          <nav className="page-x mt-8 flex flex-col gap-5" aria-label="Menu">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="display text-[34px] leading-none">
                {n.label}
              </Link>
            ))}
            <div className="mt-8 flex flex-col gap-3 text-[15px]">
              <Link href="/saved">Saved{saved.length ? ` (${saved.length})` : ''}</Link>
              <Link href="/account">Account</Link>
              <Link href="/visit">Visit the store</Link>
              <Link href="/contact">Contact</Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
