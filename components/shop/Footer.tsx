import Link from 'next/link';
import type { StoreSettings } from '@/lib/types';

export default function Footer({ settings }: { settings: StoreSettings }) {
  return (
    <footer className="mt-32 border-t border-stone">
      <div className="page-x mx-auto max-w-page py-14 grid gap-12 sm:grid-cols-2 lg:grid-cols-4 text-[14px]">
        <div>
          <p className="font-display tracking-[0.28em] text-[20px]">ALLRITE</p>
          <p className="mt-3 text-ash max-w-[28ch]">Fashion and furniture, chosen with care and sold from one store.</p>
        </div>
        <div>
          <p className="text-ash mb-3">Visit</p>
          <p>{settings.address}</p>
          <p>{settings.city}</p>
          <p className="mt-2">{settings.hours}</p>
          <Link href="/visit" className="link mt-3 inline-block">
            Directions and appointments
          </Link>
        </div>
        <div>
          <p className="text-ash mb-3">Help</p>
          <ul className="space-y-1.5">
            <li><Link href="/delivery" className="hover:underline">Delivery</Link></li>
            <li><Link href="/returns" className="hover:underline">Returns and exchanges</Link></li>
            <li><Link href="/order" className="hover:underline">Track an order</Link></li>
            <li><Link href="/contact" className="hover:underline">Contact</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-ash mb-3">Allrite</p>
          <ul className="space-y-1.5">
            <li><Link href="/about" className="hover:underline">About Allrite</Link></li>
            <li><Link href="/privacy" className="hover:underline">Privacy notice</Link></li>
            <li>
              <a href={`https://wa.me/${settings.whatsapp}`} className="hover:underline" target="_blank" rel="noreferrer">
                WhatsApp
              </a>
            </li>
            <li><a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="hover:underline">{settings.phone}</a></li>
          </ul>
        </div>
      </div>
      <div className="page-x mx-auto max-w-page pb-10 text-[12px] text-ash flex flex-wrap gap-x-6 gap-y-2">
        <span>© {new Date().getFullYear()} {settings.storeName}</span>
        <span>Prices in naira, including VAT where it applies.</span>
        <Link href="/staff/login" className="hover:underline">Staff sign in</Link>
      </div>
    </footer>
  );
}
