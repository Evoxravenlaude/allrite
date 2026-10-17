'use client';

import { useState } from 'react';

const TIMES = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

function tomorrow() {
  const d = new Date(Date.now() + 86400000);
  return d.toISOString().slice(0, 10);
}

export default function ViewingForm({ productId, productName, onDone }: { productId: string; productName: string; onDone: () => void }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setState('sending');
    const res = await fetch('/api/viewings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId,
        name: form.get('name'),
        phone: form.get('phone'),
        email: form.get('email'),
        date: form.get('date'),
        time: form.get('time'),
        note: form.get('note'),
      }),
    });
    if (res.ok) {
      setState('sent');
      onDone();
    } else {
      setError((await res.json()).error ?? 'The request did not go through. Try again or message us on WhatsApp.');
      setState('error');
    }
  }

  if (state === 'sent') {
    return (
      <div className="mt-5 p-5 bg-white border border-stone text-[14px] fade-in" role="status">
        <p>Your viewing request for the {productName} has reached our team.</p>
        <p className="text-ash mt-1">We will confirm the time by phone or WhatsApp within one working day.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-5 p-5 bg-white border border-stone grid gap-4 sm:grid-cols-2 text-[14px] fade-in">
      <p className="sm:col-span-2">Choose a date and time. We will confirm it with you before your visit.</p>
      <label className="sm:col-span-2">
        <span className="label">Your name</span>
        <input name="name" required className="field" autoComplete="name" />
      </label>
      <label>
        <span className="label">Phone</span>
        <input name="phone" required className="field" type="tel" autoComplete="tel" />
      </label>
      <label>
        <span className="label">Email (optional)</span>
        <input name="email" className="field" type="email" autoComplete="email" />
      </label>
      <label>
        <span className="label">Date</span>
        <input name="date" required className="field" type="date" min={tomorrow()} defaultValue={tomorrow()} />
      </label>
      <label>
        <span className="label">Time</span>
        <select name="time" className="field" defaultValue="12:00">
          {TIMES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>
      <label className="sm:col-span-2">
        <span className="label">Anything we should prepare (optional)</span>
        <textarea name="note" rows={2} className="field" />
      </label>
      {state === 'error' && <p className="sm:col-span-2 text-alert">{error}</p>}
      <button className="btn sm:col-span-2" disabled={state === 'sending'}>
        {state === 'sending' ? 'Sending request' : 'Request this viewing'}
      </button>
    </form>
  );
}
