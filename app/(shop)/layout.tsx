import Header from '@/components/shop/Header';
import Footer from '@/components/shop/Footer';
import BagDrawer from '@/components/shop/BagDrawer';
import WhatsAppButton from '@/components/shop/WhatsAppButton';
import { ShopProvider } from '@/components/shop/state';
import { currentCustomer } from '@/lib/auth';
import { getSettings, listSaved } from '@/lib/store';
import { paystackLive } from '@/lib/paystack';
import { dbKind } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [settings, customer] = await Promise.all([getSettings(), currentCustomer()]);
  const saved = customer ? await listSaved(customer.id) : null;
  const preview = !paystackLive();
  const resets = preview && (await dbKind()) === 'embedded';
  return (
    <ShopProvider signedIn={!!customer} initialSaved={saved}>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>
      {preview && (
        <p className="bg-ink text-white text-[12px] text-center px-4 py-2">
          Preview site. Payments are simulated and no money is taken.{resets ? ' Changes are cleared from time to time.' : ''}
        </p>
      )}
      <Header />
      <main id="main">{children}</main>
      <Footer settings={settings} />
      <BagDrawer />
      <WhatsAppButton number={settings.whatsapp} />
    </ShopProvider>
  );
}
