'use client';

import { useRouter } from 'next/navigation';

export default function DayPicker({ value, max }: { value: string; max: string }) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2 text-[13px]">
      <span className="text-ash">Day</span>
      <input
        type="date"
        value={value}
        max={max}
        onChange={(e) => e.target.value && router.push(`/admin?day=${e.target.value}`)}
        className="field h-10 w-auto"
      />
    </label>
  );
}
