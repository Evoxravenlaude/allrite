'use client';

import { useActionState } from 'react';
import { register, saveProfile, signIn } from '@/lib/actions/customer';

export function AuthForms({ next }: { next: string }) {
  const [inState, inAction, inPending] = useActionState(signIn, undefined);
  const [upState, upAction, upPending] = useActionState(register, undefined);
  return (
    <div className="mt-12 grid gap-14 md:grid-cols-2 max-w-[960px]">
      <form action={inAction} className="grid gap-4 content-start">
        <h2 className="text-[17px]">Sign in</h2>
        <input type="hidden" name="next" value={next} />
        <label>
          <span className="label">Email</span>
          <input name="email" type="email" required autoComplete="email" className="field" />
        </label>
        <label>
          <span className="label">Password</span>
          <input name="password" type="password" required autoComplete="current-password" className="field" />
        </label>
        {inState?.error && <p className="text-alert text-[14px]" role="alert">{inState.error}</p>}
        <button className="btn mt-2" disabled={inPending}>{inPending ? 'Signing in' : 'Sign in'}</button>
        <p className="text-[13px] text-ash">Forgotten your password? Message us on WhatsApp and we will reset it for you.</p>
      </form>
      <form action={upAction} className="grid gap-4 content-start">
        <h2 className="text-[17px]">Create an account</h2>
        <input type="hidden" name="next" value={next} />
        <label>
          <span className="label">Full name</span>
          <input name="name" required autoComplete="name" className="field" />
        </label>
        <label>
          <span className="label">Email</span>
          <input name="email" type="email" required autoComplete="email" className="field" />
        </label>
        <label>
          <span className="label">Phone (optional)</span>
          <input name="phone" type="tel" autoComplete="tel" className="field" />
        </label>
        <label>
          <span className="label">Password, at least 8 characters</span>
          <input name="password" type="password" required minLength={8} autoComplete="new-password" className="field" />
        </label>
        {upState?.error && <p className="text-alert text-[14px]" role="alert">{upState.error}</p>}
        <button className="btn-quiet mt-2" disabled={upPending}>{upPending ? 'Creating account' : 'Create account'}</button>
        <p className="text-[13px] text-ash">If you have ordered before with this email, your past orders will appear in your new account.</p>
      </form>
    </div>
  );
}

export function ProfileForm({ name, phone, email }: { name: string; phone: string; email: string }) {
  const [state, action, pending] = useActionState(saveProfile, undefined);
  return (
    <form action={action} className="grid gap-4">
      <p className="text-[14px] text-ash">{email}</p>
      <label>
        <span className="label">Full name</span>
        <input name="name" defaultValue={name} required className="field" />
      </label>
      <label>
        <span className="label">Phone</span>
        <input name="phone" defaultValue={phone} className="field" />
      </label>
      {state?.error && <p className="text-alert text-[14px]">{state.error}</p>}
      {state?.ok && <p className="text-[14px]" role="status">{state.ok}</p>}
      <button className="btn-quiet btn-sm justify-self-start" disabled={pending}>Save details</button>
    </form>
  );
}
