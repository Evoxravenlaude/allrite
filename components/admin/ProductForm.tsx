'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import { deleteProductAction, saveProductAction, type ActionResult } from '@/lib/actions/admin';
import { ean13 } from '@/lib/format';
import type { Department, Product, ProductImage } from '@/lib/types';

type VariantRow = { key: string; id?: string; size: string; colour: string; barcode: string; stock: number; low_stock_at: number };

let rowKey = 0;
const nextKey = () => `row-${++rowKey}`;

export default function ProductForm({
  product,
  categories,
  firstBarcode,
}: {
  product?: Product;
  categories: { category: string; department: Department }[];
  firstBarcode: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [department, setDepartment] = useState<Department>(product?.department ?? 'fashion');
  const [images, setImages] = useState<ProductImage[]>(product?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [availability, setAvailability] = useState(product?.availability ?? 'ready');
  const barcodeBody = useRef(BigInt(firstBarcode.slice(0, 12)) + 1n);
  const newBarcode = () => {
    const code = ean13(String(barcodeBody.current));
    barcodeBody.current += 1n;
    return code;
  };
  const [rows, setRows] = useState<VariantRow[]>(() =>
    product?.variants.length
      ? product.variants.map((v) => ({ key: nextKey(), id: v.id, size: v.size, colour: v.colour, barcode: v.barcode, stock: v.stock, low_stock_at: v.low_stock_at }))
      : [{ key: nextKey(), size: '', colour: '', barcode: firstBarcode, stock: 0, low_stock_at: 2 }],
  );

  const isFurniture = department === 'furniture';

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setResult(null);
    try {
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.append('file', file);
        const res = await fetch('/api/admin/upload', { method: 'POST', body });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setImages((im) => [...im, { url: data.url, alt: '', kind: 'studio' }]);
      }
    } catch (err) {
      setResult({ error: (err as Error).message });
    } finally {
      setUploading(false);
    }
  }

  const move = (i: number, by: number) =>
    setImages((im) => {
      const next = [...im];
      const [item] = next.splice(i, 1);
      next.splice(Math.max(0, Math.min(next.length, i + by)), 0, item);
      return next;
    });

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const num = (k: string) => (f.get(k) ? Number(f.get(k)) : null);
    const name = String(f.get('name') ?? '').trim();
    start(async () => {
      const r = await saveProductAction({
        id: product?.id,
        department,
        category: String(f.get('category') ?? '').trim(),
        name,
        description: String(f.get('description') ?? '').trim(),
        details: String(f.get('details') ?? '').trim(),
        care: String(f.get('care') ?? '').trim(),
        price: Number(f.get('price')),
        images: images.map((im) => ({ ...im, alt: im.alt.trim() || name })),
        width_cm: isFurniture ? num('width') : null,
        depth_cm: isFurniture ? num('depth') : null,
        height_cm: isFurniture ? num('height') : null,
        materials: isFurniture ? String(f.get('materials') ?? '') : '',
        finishes: isFurniture ? String(f.get('finishes') ?? '') : '',
        availability: isFurniture ? availability : 'ready',
        lead_time_weeks: isFurniture && availability === 'made_to_order' ? num('lead') : null,
        allow_deposit: isFurniture && f.get('deposit') === 'on',
        is_new: f.get('isNew') === 'on',
        published: f.get('published') === 'on',
        variants: rows.map((r) => ({ id: r.id, size: r.size.trim(), colour: r.colour.trim(), barcode: r.barcode.trim(), stock: Number(r.stock) || 0, low_stock_at: Number(r.low_stock_at) || 0 })),
      });
      setResult(r);
      if (!r.error && !product && r.id) router.push(`/admin/products/${r.id}?created=1`);
      else router.refresh();
    });
  }

  const setRow = (key: string, patch: Partial<VariantRow>) => setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  return (
    <form onSubmit={submit} className="mt-8 grid gap-10">
      <section className="grid gap-4 sm:grid-cols-2">
        <fieldset className="sm:col-span-2">
          <legend className="label">Department</legend>
          <div className="flex gap-2">
            {(['fashion', 'furniture'] as const).map((d) => (
              <label key={d} className={`h-10 px-5 flex items-center border cursor-pointer text-[14px] ${department === d ? 'bg-ink text-white border-ink' : 'border-stone'}`}>
                <input type="radio" className="sr-only" checked={department === d} onChange={() => setDepartment(d)} />
                {d === 'fashion' ? 'Fashion' : 'Furniture'}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="sm:col-span-2"><span className="label">Name</span><input name="name" required defaultValue={product?.name} className="field" /></label>
        <label>
          <span className="label">Category</span>
          <input name="category" required defaultValue={product?.category} list="categories" className="field" placeholder={isFurniture ? 'For example: Seating' : 'For example: Dresses'} />
          <datalist id="categories">
            {categories.filter((c) => c.department === department).map((c) => <option key={c.category} value={c.category} />)}
          </datalist>
        </label>
        <label><span className="label">Price in naira</span><input name="price" type="number" min={1} step={1} required defaultValue={product?.price} className="field" /></label>
        <label className="sm:col-span-2"><span className="label">Description, shown at the top of the product page</span><textarea name="description" rows={3} defaultValue={product?.description} className="field" /></label>
        <label className="sm:col-span-2"><span className="label">{isFurniture ? 'Details' : 'Fabric and fit'}</span><textarea name="details" rows={2} defaultValue={product?.details} className="field" /></label>
        <label className="sm:col-span-2"><span className="label">Care instructions</span><textarea name="care" rows={2} defaultValue={product?.care} className="field" /></label>
      </section>

      {isFurniture && (
        <section className="grid gap-4 sm:grid-cols-3">
          <h2 className="sm:col-span-3 text-[17px]">Furniture details</h2>
          <label><span className="label">Width (cm)</span><input name="width" type="number" min={0} defaultValue={product?.width_cm ?? ''} className="field" /></label>
          <label><span className="label">Depth (cm)</span><input name="depth" type="number" min={0} defaultValue={product?.depth_cm ?? ''} className="field" /></label>
          <label><span className="label">Height (cm)</span><input name="height" type="number" min={0} defaultValue={product?.height_cm ?? ''} className="field" /></label>
          <label className="sm:col-span-3"><span className="label">Materials</span><input name="materials" defaultValue={product?.materials} className="field" /></label>
          <label className="sm:col-span-3"><span className="label">Finishes available, separated by commas</span><input name="finishes" defaultValue={product?.finishes} className="field" /></label>
          <fieldset className="sm:col-span-2">
            <legend className="label">Availability</legend>
            <div className="flex gap-2">
              {(['ready', 'made_to_order'] as const).map((a) => (
                <label key={a} className={`h-10 px-4 flex items-center border cursor-pointer text-[14px] ${availability === a ? 'border-ink bg-white' : 'border-stone'}`}>
                  <input type="radio" className="sr-only" checked={availability === a} onChange={() => setAvailability(a)} />
                  {a === 'ready' ? 'Ready for delivery' : 'Made to order'}
                </label>
              ))}
            </div>
          </fieldset>
          {availability === 'made_to_order' && (
            <label><span className="label">Waiting time (weeks)</span><input name="lead" type="number" min={1} max={52} defaultValue={product?.lead_time_weeks ?? 6} className="field" /></label>
          )}
          <label className="sm:col-span-3 flex items-center gap-2 text-[14px]">
            <input type="checkbox" name="deposit" defaultChecked={product?.allow_deposit ?? true} className="accent-ink w-4 h-4" />
            Let customers reserve this piece with a deposit
          </label>
        </section>
      )}

      <section>
        <h2 className="text-[17px]">Photographs</h2>
        <p className="text-[13px] text-ash mt-1">The first photograph is shown in the shop grid. Use portrait photos (4 wide by 5 tall) on a plain background.{isFurniture && ' Mark one photo as “in a room”.'}</p>
        <ul className="mt-4 grid gap-3 grid-cols-2 sm:grid-cols-4">
          {images.map((im, i) => (
            <li key={im.url + i} className="bg-white border border-stone p-2 text-[12px]">
              <div className="aspect-[4/5] bg-mist"><img src={im.url} alt="" className="w-full h-full object-cover" /></div>
              <input
                value={im.alt}
                onChange={(e) => setImages((ims) => ims.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)))}
                placeholder="Describe the photo"
                className="field h-8 mt-2 text-[12px] px-2"
              />
              {isFurniture && (
                <label className="flex items-center gap-1.5 mt-1.5">
                  <input type="checkbox" className="accent-ink" checked={im.kind === 'room'} onChange={(e) => setImages((ims) => ims.map((x, j) => (j === i ? { ...x, kind: e.target.checked ? 'room' : 'studio' } : x)))} />
                  In a room
                </label>
              )}
              <div className="mt-1.5 flex justify-between">
                <span className="flex gap-2">
                  <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="disabled:text-stone" aria-label="Move earlier">Earlier</button>
                  <button type="button" disabled={i === images.length - 1} onClick={() => move(i, 1)} className="disabled:text-stone" aria-label="Move later">Later</button>
                </span>
                <button type="button" onClick={() => setImages((ims) => ims.filter((_, j) => j !== i))} className="text-alert">Remove</button>
              </div>
            </li>
          ))}
          <li>
            <label className="aspect-[4/5] border border-dashed border-ash flex items-center justify-center text-center text-[13px] cursor-pointer hover:bg-white p-3">
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => upload(e.target.files)} />
              {uploading ? 'Uploading…' : 'Add photographs'}
            </label>
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-[17px]">{isFurniture ? 'Finishes and stock' : 'Sizes, colours and stock'}</h2>
        <p className="text-[13px] text-ash mt-1">
          One row for each version you sell. A new barcode is filled in for you: print it on a tag. To use the barcode already on an item, click the barcode box and scan it.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-[14px]">
            <thead className="text-left text-ash text-[12px]">
              <tr>
                {!isFurniture && <th className="font-normal pb-2 pr-2">Size</th>}
                <th className="font-normal pb-2 pr-2">{isFurniture ? 'Finish' : 'Colour'}</th>
                <th className="font-normal pb-2 pr-2">Barcode</th>
                <th className="font-normal pb-2 pr-2">In stock</th>
                <th className="font-normal pb-2 pr-2">Warn me at</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key}>
                  {!isFurniture && <td className="pr-2 pb-2"><input value={r.size} onChange={(e) => setRow(r.key, { size: e.target.value })} className="field h-10" placeholder="M" /></td>}
                  <td className="pr-2 pb-2"><input value={r.colour} onChange={(e) => setRow(r.key, { colour: e.target.value })} className="field h-10" placeholder={isFurniture ? 'Natural oak' : 'Black'} /></td>
                  <td className="pr-2 pb-2"><input value={r.barcode} onChange={(e) => setRow(r.key, { barcode: e.target.value.replace(/\D/g, '') })} onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()} className="field h-10 font-[tabular-nums]" inputMode="numeric" /></td>
                  <td className="pr-2 pb-2 w-24"><input type="number" min={0} value={r.stock} onChange={(e) => setRow(r.key, { stock: Number(e.target.value) })} className="field h-10" /></td>
                  <td className="pr-2 pb-2 w-24"><input type="number" min={0} value={r.low_stock_at} onChange={(e) => setRow(r.key, { low_stock_at: Number(e.target.value) })} className="field h-10" /></td>
                  <td className="pb-2"><button type="button" disabled={rows.length === 1} onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))} className="text-[13px] text-ash hover:text-alert disabled:invisible">Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          className="btn-quiet btn-sm mt-2"
          onClick={() => setRows((rs) => [...rs, { key: nextKey(), size: '', colour: rs.at(-1)?.colour ?? '', barcode: newBarcode(), stock: 0, low_stock_at: isFurniture ? 1 : 2 }])}
        >
          Add a row
        </button>
      </section>

      <section className="flex flex-col gap-2 text-[14px]">
        <label className="flex items-center gap-2"><input type="checkbox" name="isNew" defaultChecked={product?.is_new ?? true} className="accent-ink w-4 h-4" /> Show in New arrivals</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="published" defaultChecked={product?.published ?? true} className="accent-ink w-4 h-4" /> Show in the shop and on the store screens</label>
      </section>

      <div className="sticky bottom-0 bg-paper/95 backdrop-blur py-4 border-t border-stone flex flex-wrap items-center gap-4">
        <button className="btn" disabled={pending || uploading}>{pending ? 'Saving' : product ? 'Save changes' : 'Add product'}</button>
        {result && <p className={`text-[14px] ${result.error ? 'text-alert' : ''}`} role="status">{result.error ?? result.ok}</p>}
        {product && (
          <button
            type="button"
            className="ml-auto text-[13px] text-alert hover:underline"
            onClick={() =>
              window.confirm(`Delete ${product.name}? If it has been sold before, it will be hidden instead so your sales records stay complete.`) &&
              start(async () => {
                const r = await deleteProductAction(product.id);
                if (r.error) setResult(r);
                else router.push('/admin/products');
              })
            }
          >
            Delete product
          </button>
        )}
      </div>
    </form>
  );
}
