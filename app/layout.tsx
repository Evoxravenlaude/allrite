import type { Metadata, Viewport } from 'next';
import '@fontsource/albert-sans/400.css';
import '@fontsource/albert-sans/500.css';
import '@fontsource/albert-sans/600.css';
import '@fontsource/bodoni-moda/400.css';
import '@fontsource/bodoni-moda/500.css';
import '@fontsource/bodoni-moda/400-italic.css';
import './globals.css';
import { baseUrl } from '@/lib/paths';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl()),
  title: { default: 'Allrite Boutique and Lifestyle', template: '%s | Allrite' },
  description: 'Fashion and furniture, chosen with care. Shop online or visit the Allrite store.',
  openGraph: { siteName: 'Allrite Boutique and Lifestyle', type: 'website' },
};

export const viewport: Viewport = { themeColor: '#F6F6F3', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NG">
      <body>{children}</body>
    </html>
  );
}
