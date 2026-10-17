import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = { title: 'Track an order' };

async function find(form: FormData) {
  'use server';
  const number = String(form.get('number') ?? '').trim().toUpperCase();
  const email = String(form.get('email') ?? '').trim();
  redirect(`/order/${encodeURIComponent(number)}?e=${encodeURIComponent(email)}`);
}

export default function TrackOrder() {
  return (
    <div className="page-x mx-auto max-w-[560px] pt-14">
      <h1 className="display text-[40px] leading-none">Track an order</h1>
      <p className="mt-4 text-ash text-[15px]">Enter the order number from your confirmation email and the email address you used at checkout.</p>
      <form action={find} className="mt-8 grid gap-4">
        <label>
          <span className="label">Order number</span>
          <input name="number" required placeholder="AR-10001" className="field uppercase" />
        </label>
        <label>
          <span className="label">Email address</span>
          <input name="email" type="email" required className="field" />
        </label>
        <button className="btn mt-2">Find my order</button>
      </form>
    </div>
  );
}
