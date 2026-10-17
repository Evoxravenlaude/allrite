import type { MetadataRoute } from 'next';
import { baseUrl } from '@/lib/paths';
import { paystackLive } from '@/lib/paystack';

export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  // Until real payments are switched on, the site is a preview: keep it out of Google.
  if (!paystackLive()) return { rules: { userAgent: '*', disallow: '/' } };
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/store', '/staff', '/checkout', '/account', '/order', '/api'] },
    sitemap: `${baseUrl()}/sitemap.xml`,
  };
}
