'use server';

import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { currentCustomer, endCustomerSession, startCustomerSession } from '@/lib/auth';
import { findCustomerByEmail, registerCustomer, updateCustomer } from '@/lib/store';

export type FormState = { error?: string; ok?: string } | undefined;

function safeNext(next: FormDataEntryValue | null) {
  const value = String(next ?? '');
  return value.startsWith('/') && !value.startsWith('//') ? value : '/account';
}

export async function signIn(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get('email') ?? '').trim();
  const password = String(form.get('password') ?? '');
  const customer = await findCustomerByEmail(email);
  if (!customer?.password_hash || !(await bcrypt.compare(password, customer.password_hash))) {
    return { error: 'That email and password do not match an account. Check them and try again.' };
  }
  await startCustomerSession(customer.id);
  redirect(safeNext(form.get('next')));
}

export async function register(_: FormState, form: FormData): Promise<FormState> {
  const name = String(form.get('name') ?? '').trim();
  const email = String(form.get('email') ?? '').trim();
  const phone = String(form.get('phone') ?? '').trim();
  const password = String(form.get('password') ?? '');
  if (name.length < 2) return { error: 'Enter your full name.' };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: 'Enter a valid email address.' };
  if (password.length < 8) return { error: 'Choose a password of at least 8 characters.' };
  try {
    const id = await registerCustomer({ name, email, phone, passwordHash: await bcrypt.hash(password, 10) });
    await startCustomerSession(id);
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'The account could not be created.' };
  }
  redirect(safeNext(form.get('next')));
}

export async function signOut() {
  await endCustomerSession();
  redirect('/');
}

export async function saveProfile(_: FormState, form: FormData): Promise<FormState> {
  const customer = await currentCustomer();
  if (!customer) return { error: 'Sign in again to update your details.' };
  await updateCustomer(customer.id, { name: String(form.get('name') ?? '').trim(), phone: String(form.get('phone') ?? '').trim() });
  revalidatePath('/account');
  return { ok: 'Your details are saved.' };
}
