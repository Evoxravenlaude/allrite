import { listCategories, listFacets, listProducts, type ProductFilter } from '@/lib/store';
import type { Department } from '@/lib/types';
import { ProductGrid } from './ProductCard';
import Filters from './Filters';

export type CatalogueParams = { [key: string]: string | string[] | undefined };

const str = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

export default async function Catalogue({
  title,
  intro,
  department,
  newOnly,
  search,
  params,
  basePath,
}: {
  title: string;
  intro?: string;
  department?: Department;
  newOnly?: boolean;
  search?: string;
  params: CatalogueParams;
  basePath: string;
}) {
  const filter: ProductFilter = {
    department,
    newOnly,
    search,
    category: str(params.category),
    size: str(params.size),
    colour: str(params.colour),
    minPrice: Number(str(params.min)) || undefined,
    maxPrice: Number(str(params.max)) || undefined,
    inStock: str(params.instock) === '1',
    sort: (str(params.sort) as ProductFilter['sort']) || 'new',
  };
  const [products, categories, facets] = await Promise.all([
    listProducts(filter),
    listCategories(department),
    listFacets(department),
  ]);
  const stock = Object.fromEntries(products.flatMap((p) => p.variants.map((v) => [v.id, v.stock])));
  const showCategories = department ? categories : [];

  return (
    <div className="page-x mx-auto max-w-page pt-10 sm:pt-14">
      <div className="max-w-[62ch]">
        <h1 className="display text-[40px] sm:text-[56px] leading-none">{title}</h1>
        {intro && <p className="mt-4 text-ash text-[15px]">{intro}</p>}
      </div>
      <Filters
        basePath={basePath}
        categories={showCategories.map((c) => c.category)}
        sizes={department === 'furniture' ? [] : facets.sizes}
        colours={facets.colours}
        current={{
          category: filter.category,
          size: filter.size,
          colour: filter.colour,
          min: str(params.min),
          max: str(params.max),
          instock: str(params.instock),
          sort: str(params.sort),
          q: search,
        }}
        count={products.length}
      />
      {products.length ? (
        <ProductGrid products={products} initialStock={stock} variant={department === 'furniture' ? 'furniture' : 'fashion'} />
      ) : (
        <div className="py-20 max-w-[50ch]">
          <p className="display text-[26px]">Nothing matches these choices.</p>
          <p className="mt-3 text-ash">Remove a filter to see more pieces, or ask our team on WhatsApp whether something is coming in.</p>
        </div>
      )}
    </div>
  );
}
