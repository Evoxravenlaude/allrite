import type { Metadata } from 'next';
import Catalogue, { type CatalogueParams } from '@/components/shop/Catalogue';

export const metadata: Metadata = {
  title: 'Fashion',
  description: 'Dresses, tailoring, kaftans, bags and shoes from Allrite Boutique and Lifestyle.',
};

export default async function FashionPage({ searchParams }: { searchParams: Promise<CatalogueParams> }) {
  return (
    <Catalogue
      title="Fashion"
      intro="Dresses, tailoring, kaftans, bags and shoes. Every size shows its live stock."
      department="fashion"
      params={await searchParams}
      basePath="/fashion"
    />
  );
}
