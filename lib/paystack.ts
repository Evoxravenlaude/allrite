import 'server-only';
import crypto from 'node:crypto';

const API = 'https://api.paystack.co';

/** Without a Paystack secret key the site runs in demo mode and simulates payments. */
export function paystackLive() {
  return !!process.env.PAYSTACK_SECRET_KEY;
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(API + path, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });
  const body = await res.json();
  if (!res.ok || body.status === false) throw new Error(body.message || 'Paystack did not accept the request.');
  return body.data as T;
}

export async function initializePayment(input: {
  email: string;
  amount: number; // naira
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}) {
  return call<{ authorization_url: string; access_code: string; reference: string }>('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({
      email: input.email,
      amount: Math.round(input.amount * 100),
      currency: 'NGN',
      reference: input.reference,
      callback_url: input.callbackUrl,
      channels: ['card', 'bank_transfer', 'ussd', 'bank'],
      metadata: input.metadata ?? {},
    }),
  });
}

export async function verifyPayment(reference: string) {
  const data = await call<{ status: string; amount: number; reference: string }>(
    `/transaction/verify/${encodeURIComponent(reference)}`,
  );
  return { success: data.status === 'success', amount: Math.round(data.amount / 100) };
}

export function validWebhookSignature(rawBody: string, signature: string | null) {
  if (!process.env.PAYSTACK_SECRET_KEY || !signature) return false;
  const hash = crypto.createHmac('sha512', process.env.PAYSTACK_SECRET_KEY).update(rawBody).digest('hex');
  return hash.length === signature.length && crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
}
