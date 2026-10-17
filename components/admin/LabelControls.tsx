'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export default function LabelControls() {
  const router = useRouter();
  const pathname = usePathname();
  const each = useSearchParams().get('each') ?? '1';
  return (
    <div className="no-print p-6 border-b border-stone flex flex-wrap items-center gap-4 text-[14px]">
      <label className="flex items-center gap-2">
        Labels per version
        <select value={each} onChange={(e) => router.replace(`${pathname}?each=${e.target.value}`)} className="field h-10 w-auto">
          <option value="1">One each</option>
          <option value="stock">One for every piece in stock</option>
          <option value="5">Five each</option>
          <option value="10">Ten each</option>
        </select>
      </label>
      <button className="btn btn-sm" onClick={() => window.print()}>Print labels</button>
      <p className="text-ash text-[13px]">Each label is 50 × 32 mm. Print on sticker paper and attach to the tag.</p>
    </div>
  );
}
