'use server';

import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { endStaffSession, startStaffSession } from '@/lib/auth';
import { findStaffByEmail } from '@/lib/store';

export async function staffSignIn(_: { error?: string } | undefined, form: FormData) {
  const staff = await findStaffByEmail(String(form.get('email') ?? ''));
  const password = String(form.get('password') ?? '');
  if (!staff || !staff.active || !(await bcrypt.compare(password, staff.password_hash))) {
    return { error: 'That email and password do not match an active staff account.' };
  }
  await startStaffSession(staff.id);
  redirect(staff.role === 'sales' ? '/store/counter' : '/admin');
}

export async function staffSignOut() {
  await endStaffSession();
  redirect('/staff/login');
}
