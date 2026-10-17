'use client';

import { useActionState } from 'react';
import { staffSignIn } from '@/lib/actions/staff';

export default function StaffLoginForm() {
  const [state, action, pending] = useActionState(staffSignIn, undefined);
  return (
    <form action={action} className="mt-8 grid gap-4">
      <label>
        <span className="label">Email</span>
        <input name="email" type="email" required autoComplete="username" className="field" autoFocus />
      </label>
      <label>
        <span className="label">Password</span>
        <input name="password" type="password" required autoComplete="current-password" className="field" />
      </label>
      {state?.error && <p className="text-alert text-[14px]" role="alert">{state.error}</p>}
      <button className="btn mt-2" disabled={pending}>{pending ? 'Signing in' : 'Sign in'}</button>
    </form>
  );
}
