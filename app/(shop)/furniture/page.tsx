import type { Metadata } from 'next';
import Catalogue, { type CatalogueParams } from '@/components/shop/Catalogue';

export const metadata: Metadata = {
  title: 'Furniture',
  description: 'Seating, tables, storage, lighting and objects from Allrite Boutique and Lifestyle.',
};

export default async function FurniturePage({ searchParams }: { searchParams: Promise<CatalogueParams> }) {
  return (
    <Catalogue
      title="Furniture"
      intro="Seating, tables, storage, lighting and objects. Larger pieces can be reserved with a deposit and viewed in the store by appointment."
      department="furniture"
      params={await searchParams}
      basePath="/furniture"
    />
  );
}
