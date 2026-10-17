'use client';

import { useState } from 'react';

export default function DemoPayButton({ reference }: { reference: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <div className="mt-6">
      <button
        className="btn w-full"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const res = await fetch('/api/demo-pay', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reference }) });
          const body = await res.json();
          if (!res.ok) {
            setError(body.error);
            setBusy(false);
            return;
          }
          window.location.href = `/order/${body.number}?e=${encodeURIComponent(body.email)}&payment=success`;
        }}
      >
        {busy ? 'Confirming payment' : 'Complete demo payment'}
      </button>
      {error && <p className="mt-3 text-alert text-[14px]">{error}</p>}
    </div>
  );
}
