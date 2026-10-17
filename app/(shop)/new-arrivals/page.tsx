import type { Metadata } from 'next';
import Catalogue, { type CatalogueParams } from '@/components/shop/Catalogue';

export const metadata: Metadata = { title: 'New arrivals' };

export default async function NewArrivalsPage({ searchParams }: { searchParams: Promise<CatalogueParams> }) {
  return (
    <Catalogue
      title="New arrivals"
      intro="The latest pieces in fashion and furniture."
      newOnly
      params={await searchParams}
      basePath="/new-arrivals"
    />
  );
}
