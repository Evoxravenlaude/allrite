import type { MetadataRoute } from 'next';
import { listProducts } from '@/lib/store';
import { baseUrl } from '@/lib/paths';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = baseUrl();
  const products = await listProducts();
  const pages = ['', '/fashion', '/furniture', '/new-arrivals', '/about', '/visit', '/delivery', '/returns', '/contact', '/privacy'];
  return [
    ...pages.map((p) => ({ url: base + p, changeFrequency: 'weekly' as const, priority: p === '' ? 1 : 0.7 })),
    ...products.map((p) => ({ url: `${base}/product/${p.slug}`, lastModified: p.created_at, priority: 0.8 })),
  ];
}
