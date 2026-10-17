import type { Metadata } from 'next';
import Catalogue, { type CatalogueParams } from '@/components/shop/Catalogue';

export const metadata: Metadata = { title: 'Search', robots: { index: false } };

export default async function SearchPage({ searchParams }: { searchParams: Promise<CatalogueParams> }) {
  const params = await searchParams;
  const term = (Array.isArray(params.q) ? params.q[0] : params.q)?.trim() ?? '';
  return (
    <Catalogue
      title={term ? `Results for “${term}”` : 'Search'}
      intro={term ? undefined : 'Use the search bar at the top of the page to find a piece by name, material or colour.'}
      search={term || undefined}
      params={params}
      basePath="/search"
    />
  );
}
