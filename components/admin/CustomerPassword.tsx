'use client';

import { useState, useTransition } from 'react';
import { customerPasswordAction, type ActionResult } from '@/lib/actions/admin';

export default function CustomerPassword({ customerId }: { customerId: string }) {
  const [password, setPassword] = useState('');
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="mt-8 max-w-[480px]">
      <h2 className="text-[15px]">Set a new password for this customer</h2>
      <p className="text-[13px] text-ash mt-1">Use this when a customer asks for help signing in. Confirm who they are first.</p>
      <div className="mt-3 flex gap-2">
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" className="field h-10" />
        <button
          className="btn-quiet btn-sm h-10 shrink-0"
          disabled={pending || password.length === 0}
          onClick={() => start(async () => { const r = await customerPasswordAction(customerId, password); setResult(r); if (!r.error) setPassword(''); })}
        >
          Set password
        </button>
      </div>
      {result && <p className={`mt-2 text-[13px] ${result.error ? 'text-alert' : ''}`}>{result.error ?? result.ok}</p>}
    </div>
  );
}
