'use client';

import { useState } from 'react';

export default function PayOrderButton({ number, email, label }: { number: string; email: string; label: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <div className="mt-4">
      <button
        className="btn"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError('');
          const res = await fetch('/api/pay', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ number, email }) });
          const body = await res.json();
          if (!res.ok) {
            setError(body.error);
            setBusy(false);
            return;
          }
          window.location.href = body.url;
        }}
      >
        {busy ? 'Opening secure payment' : label}
      </button>
      {error && <p className="mt-3 text-alert text-[14px]">{error}</p>}
    </div>
  );
}
