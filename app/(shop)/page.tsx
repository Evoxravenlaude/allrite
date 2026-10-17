import Link from 'next/link';
import { listProducts, getSettings } from '@/lib/store';
import { ProductGrid } from '@/components/shop/ProductCard';

export default async function Home() {
  const [arrivals, settings] = await Promise.all([listProducts({ newOnly: true, limit: 8 }), getSettings()]);
  const stock = Object.fromEntries(arrivals.flatMap((p) => p.variants.map((v) => [v.id, v.stock])));

  return (
    <>
      <section className="relative">
        <div className="relative h-[calc(100svh-4rem)] min-h-[520px] max-h-[920px] bg-mist overflow-hidden">
          <img
            src="/placeholders/hero.svg"
            alt="The Adire Silk Shirt Dress beside the Iroko Lounge Chair"
            className="absolute inset-0 w-full h-full object-cover object-[90%_50%] sm:object-[30%_50%] fade-in"
          />
          <div className="sm:hidden absolute inset-x-0 bottom-0 h-[50%] bg-gradient-to-t from-paper/85 via-paper/40 to-transparent" aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-0 page-x pb-10 sm:pb-14 mx-auto max-w-page">
            <h1 className="display text-[40px] sm:text-[56px] lg:text-[72px] leading-[0.98] max-w-[14ch] text-ink">
              Fashion and furniture for the way you live.
            </h1>
            <Link href="/new-arrivals" className="btn mt-7">
              Shop new arrivals
            </Link>
          </div>
        </div>
      </section>

      <section className="page-x mx-auto max-w-page mt-20 sm:mt-28">
        <div className="flex items-baseline justify-between mb-8">
          <h2 className="display text-[28px] sm:text-[34px]">New arrivals</h2>
          <Link href="/new-arrivals" className="link text-[14px]">
            See all new arrivals
          </Link>
        </div>
        <ProductGrid products={arrivals} initialStock={stock} />
      </section>

      <section className="page-x mx-auto max-w-page mt-24 sm:mt-32 grid gap-6 md:grid-cols-2">
        <Link href="/fashion" className="group block">
          <div className="aspect-[4/5] bg-mist overflow-hidden">
            <img src="/ph/coat/6/front.svg" alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" />
          </div>
          <h2 className="display text-[30px] mt-4">Fashion</h2>
          <p className="text-ash text-[14px] mt-1">Dresses, tailoring, kaftans, bags and shoes.</p>
        </Link>
        <Link href="/furniture" className="group block">
          <div className="aspect-[4/5] bg-mist overflow-hidden">
            <img src="/ph/armchair/7/room.svg" alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]" />
          </div>
          <h2 className="display text-[30px] mt-4">Furniture</h2>
          <p className="text-ash text-[14px] mt-1">Seating, tables, storage, lighting and objects.</p>
        </Link>
      </section>

      <section className="page-x mx-auto max-w-page mt-24 sm:mt-32 grid gap-10 lg:grid-cols-12">
        <h2 className="display text-[30px] sm:text-[40px] leading-[1.05] lg:col-span-5 max-w-[16ch]">Made by hand, much of it close to home.</h2>
        <div className="lg:col-span-6 lg:col-start-7 text-[16px] leading-[1.7] space-y-5 max-w-[60ch]">
          <p>
            Our indigo silks are dyed in Abeokuta. Our lounge chairs are built in Lagos by a workshop of four. The lamps are thrown by
            a ceramicist in Ilorin. We sit them beside pieces from Italy and beyond, chosen for how well they are made and how long they last.
          </p>
          <p>Every product page tells you what a piece is made of, how it fits or measures, and how to care for it.</p>
          <Link href="/about" className="link inline-block">
            About Allrite
          </Link>
        </div>
      </section>

      <section className="page-x mx-auto max-w-page mt-24 sm:mt-32">
        <div className="bg-white grid md:grid-cols-2">
          <div className="aspect-[4/3] md:aspect-auto bg-mist">
            <img src="/ph/sofa/2/room.svg" alt="" className="w-full h-full object-cover" />
          </div>
          <div className="p-8 sm:p-12 lg:p-16 flex flex-col justify-center">
            <h2 className="display text-[30px] sm:text-[36px]">Visit the store</h2>
            <p className="mt-4 text-[15px]">{settings.address}, {settings.city}</p>
            <p className="text-ash text-[15px]">{settings.hours}</p>
            <p className="mt-5 text-[15px] max-w-[46ch]">
              Book a private appointment to see a furniture piece in person, or ask our team anything on WhatsApp. Online orders can be
              collected from the store at no charge.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/visit" className="btn">
                Plan your visit
              </Link>
              <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noreferrer" className="btn-quiet">
                Message us on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="page-x mx-auto max-w-page mt-28 overflow-hidden" aria-hidden="true">
        <p className="font-display text-center leading-[0.8] tracking-[0.06em] text-[15.5vw] xl:text-[226px] select-none -mb-[0.12em]">
          ALLRITE
        </p>
      </div>
    </>
  );
}
