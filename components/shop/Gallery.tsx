'use client';

import { useRef, useState } from 'react';
import type { ProductImage } from '@/lib/types';

export default function Gallery({ images }: { images: ProductImage[] }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState<number | null>(null);
  const strip = useRef<HTMLDivElement>(null);

  const onScroll = () => {
    const el = strip.current;
    if (el) setIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  if (!images.length) return <div className="aspect-[4/5] bg-mist" />;

  return (
    <>
      {/* Phone: swipe through images */}
      <div className="lg:hidden relative">
        <div ref={strip} onScroll={onScroll} className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar">
          {images.map((img, i) => (
            <button key={img.url + i} className="snap-center shrink-0 w-full aspect-[4/5] bg-mist" onClick={() => setZoom(i)}>
              <img src={img.url} alt={img.alt} className="w-full h-full object-cover" loading={i === 0 ? 'eager' : 'lazy'} />
            </button>
          ))}
        </div>
        <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5" aria-hidden="true">
          {images.map((_, i) => (
            <span key={i} className={`h-[3px] w-5 ${i === index ? 'bg-ink' : 'bg-ink/20'}`} />
          ))}
        </div>
      </div>

      {/* Larger screens: images stacked in two columns */}
      <div className="hidden lg:grid grid-cols-2 gap-3">
        {images.map((img, i) => (
          <button
            key={img.url + i}
            onClick={() => setZoom(i)}
            className={`bg-mist aspect-[4/5] cursor-zoom-in ${i === 0 ? 'col-span-2 aspect-[4/4.4]' : ''}`}
            aria-label={`Enlarge image: ${img.alt}`}
          >
            <img src={img.url} alt={img.alt} className="w-full h-full object-cover" loading={i < 2 ? 'eager' : 'lazy'} />
          </button>
        ))}
      </div>

      {zoom !== null && (
        <div className="fixed inset-0 z-50 bg-paper fade-in flex flex-col" role="dialog" aria-modal="true" aria-label="Image viewer">
          <div className="h-16 page-x flex items-center justify-between text-[14px]">
            <span className="text-ash">
              {zoom + 1} of {images.length}
            </span>
            <button onClick={() => setZoom(null)} autoFocus>
              Close
            </button>
          </div>
          <div className="flex-1 min-h-0 flex items-center justify-center px-4 pb-6 gap-4">
            <button className="hidden sm:block p-3 disabled:opacity-20" disabled={zoom === 0} onClick={() => setZoom(zoom - 1)} aria-label="Previous image">
              ‹
            </button>
            <img src={images[zoom].url} alt={images[zoom].alt} className="max-h-full max-w-full object-contain" />
            <button
              className="hidden sm:block p-3 disabled:opacity-20"
              disabled={zoom === images.length - 1}
              onClick={() => setZoom(zoom + 1)}
              aria-label="Next image"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </>
  );
}
