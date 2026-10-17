'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { viewingStatusAction } from '@/lib/actions/admin';

export default function ViewingStatus({ id, status, labels }: { id: string; status: string; labels: Record<string, string> }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <label className="text-[13px]">
      <span className="sr-only">Viewing status</span>
      <select
        value={status}
        disabled={pending}
        onChange={(e) => start(async () => { await viewingStatusAction(id, e.target.value); router.refresh(); })}
        className={`field h-10 w-auto ${status === 'requested' ? 'border-indigo text-indigo' : ''}`}
      >
        {Object.entries(labels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}
