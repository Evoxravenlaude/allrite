import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProductBySlug, getSettings, listProducts } from '@/lib/store';
import ProductPanel from '@/components/shop/ProductPanel';
import Gallery from '@/components/shop/Gallery';
import { ProductGrid } from '@/components/shop/ProductCard';
import { WhatsAppTopic } from '@/components/shop/WhatsAppButton';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductBySlug((await params).slug);
  if (!product) return { title: 'Not found' };
  const price = `₦${product.price.toLocaleString('en-NG')}`;
  return {
    title: product.name,
    description: `${product.description.slice(0, 150)} ${price}.`,
    openGraph: {
      title: `${product.name}, ${price}`,
      description: product.description.slice(0, 200),
      images: product.images[0] ? [{ url: product.images[0].url, alt: product.images[0].alt }] : [],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProductBySlug((await params).slug);
  if (!product) notFound();
  const [settings, related] = await Promise.all([
    getSettings(),
    listProducts({ department: product.department, category: product.category, limit: 5 }),
  ]);
  const more = related.filter((p) => p.id !== product.id).slice(0, 4);
  const moreStock = Object.fromEntries(more.flatMap((p) => p.variants.map((v) => [v.id, v.stock])));
  const inStock = product.availability === 'made_to_order' || product.variants.some((v) => v.stock > 0);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    category: product.category,
    image: product.images.map((i) => i.url),
    sku: product.variants[0]?.barcode,
    brand: { '@type': 'Brand', name: 'Allrite' },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'NGN',
      price: product.price,
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <div className="mx-auto max-w-page">
      <WhatsAppTopic topic={product.name} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="page-x pt-6 text-[13px] text-ash" aria-label="Breadcrumb">
        <Link href={`/${product.department}`} className="hover:underline">
          {product.department === 'fashion' ? 'Fashion' : 'Furniture'}
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/${product.department}?category=${encodeURIComponent(product.category)}`} className="hover:underline">
          {product.category}
        </Link>
      </nav>

      <div className="mt-4 lg:grid lg:grid-cols-12 lg:gap-12 lg:page-x">
        <div className="lg:col-span-7">
          <Gallery images={product.images} />
        </div>
        <div className="lg:col-span-5 page-x lg:px-0 mt-8 lg:mt-0">
          <div className="lg:sticky lg:top-24">
            <ProductPanel product={product} settings={{ depositPercent: settings.depositPercent, whatsapp: settings.whatsapp }} />
          </div>
        </div>
      </div>

      {more.length > 0 && (
        <section className="page-x mt-28">
          <h2 className="display text-[28px] mb-8">More in {product.category.toLowerCase()}</h2>
          <ProductGrid products={more} initialStock={moreStock} variant={product.department} />
        </section>
      )}
    </div>
  );
}
