import { notFound } from 'next/navigation';
import { requireStaff } from '@/lib/auth';
import { getProductById } from '@/lib/store';
import { naira } from '@/lib/format';
import Ean13 from '@/components/admin/Ean13';
import LabelControls from '@/components/admin/LabelControls';

export const metadata = { title: 'Barcode labels' };

export default async function Labels({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ each?: string }> }) {
  await requireStaff('edit_products');
  const product = await getProductById((await params).id);
  if (!product) notFound();
  const { each } = await searchParams;
  const perVariant = each === 'stock' ? null : Math.max(1, Math.min(50, Number(each) || 1));
  const labels = product.variants.flatMap((v) => Array.from({ length: perVariant ?? Math.max(1, v.stock) }, () => v));
  return (
    <div className="fixed inset-0 z-50 bg-white overflow-auto">
      <style>{`@page { margin: 8mm; }`}</style>
      <LabelControls />
      <div className="p-6 print:p-0 flex flex-wrap gap-[3mm]">
        {labels.map((v, i) => (
          <div key={v.id + i} className="w-[50mm] h-[32mm] border border-stone print:border-black/20 p-[2mm] flex flex-col text-black break-inside-avoid">
            <p className="font-display tracking-[0.2em] text-[8px]">ALLRITE</p>
            <p className="text-[9px] leading-tight truncate">{product.name}</p>
            <p className="text-[9px] leading-tight flex justify-between"><span>{[v.size, v.colour].filter(Boolean).join(', ')}</span><span>{naira(product.price)}</span></p>
            <div className="mt-auto"><Ean13 code={v.barcode} height={34} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
