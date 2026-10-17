'use client';

import { useActionState, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createStaffAction, updateStaffAction, type ActionResult } from '@/lib/actions/admin';
import type { Role } from '@/lib/types';

export function StaffRowControls({ id, role, active, self }: { id: string; role: Role; active: boolean; self: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<ActionResult | null>(null);
  const [password, setPassword] = useState('');
  const run = (changes: Parameters<typeof updateStaffAction>[1]) =>
    start(async () => {
      const r = await updateStaffAction(id, changes);
      setMsg(r);
      if (!r.error) {
        setPassword('');
        router.refresh();
      }
    });
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select value={role} disabled={pending || self} onChange={(e) => run({ role: e.target.value as Role })} className="field h-9 w-auto text-[13px]" aria-label="Role">
        <option value="sales">Sales</option>
        <option value="manager">Manager</option>
        <option value="owner">Owner</option>
      </select>
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" className="field h-9 w-36 text-[13px]" aria-label="New password" />
      <button className="btn-quiet btn-sm" disabled={pending || password.length === 0} onClick={() => run({ password })}>Set password</button>
      {!self && (
        <button className="text-[13px] link" disabled={pending} onClick={() => run({ active: !active })}>
          {active ? 'Switch off' : 'Switch on'}
        </button>
      )}
      {msg && <span className={`w-full text-[12px] ${msg.error ? 'text-alert' : 'text-ash'}`}>{msg.error ?? msg.ok}</span>}
    </div>
  );
}

export function StaffAdd() {
  const [state, action, pending] = useActionState(createStaffAction, undefined);
  return (
    <form action={action} className="mt-10 grid gap-4 sm:grid-cols-2 max-w-[640px]">
      <h2 className="sm:col-span-2 text-[17px]">Add a staff member</h2>
      <label><span className="label">Name</span><input name="name" required className="field" /></label>
      <label><span className="label">Email, used to sign in</span><input name="email" type="email" required className="field" /></label>
      <label>
        <span className="label">Role</span>
        <select name="role" className="field" defaultValue="sales">
          <option value="sales">Sales</option>
          <option value="manager">Manager</option>
          <option value="owner">Owner</option>
        </select>
      </label>
      <label><span className="label">First password, at least 8 characters</span><input name="password" type="text" required minLength={8} className="field" /></label>
      {state && <p className={`sm:col-span-2 text-[14px] ${state.error ? 'text-alert' : ''}`}>{state.error ?? state.ok}</p>}
      <button className="btn sm:col-span-2 justify-self-start" disabled={pending}>Add staff member</button>
    </form>
  );
}
