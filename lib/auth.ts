import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SignJWT, jwtVerify } from 'jose';
import { getCustomer, getStaff } from './store';
import type { Role } from './types';

const STAFF_COOKIE = 'allrite_staff';
const CUSTOMER_COOKIE = 'allrite_customer';

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value && process.env.NODE_ENV === 'production' && process.env.DEMO_MODE !== '1') {
    throw new Error('SESSION_SECRET must be set in production.');
  }
  return new TextEncoder().encode(value || 'allrite-local-demo-secret-change-me');
}

async function sign(payload: Record<string, string>, days: number) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${days}d`)
    .sign(secret());
}

async function read(name: string) {
  const token = (await cookies()).get(name)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as Record<string, string>;
  } catch {
    return null;
  }
}

const cookieOptions = (days: number) => ({
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: days * 86400,
});

/* ------------------------------------------------------------------ staff */

export async function startStaffSession(staffId: string) {
  (await cookies()).set(STAFF_COOKIE, await sign({ sub: staffId }, 1), cookieOptions(1));
}

export async function endStaffSession() {
  (await cookies()).delete(STAFF_COOKIE);
}

export async function currentStaff() {
  const payload = await read(STAFF_COOKIE);
  if (!payload?.sub) return null;
  const staff = await getStaff(payload.sub);
  return staff?.active ? staff : null;
}

export type Permission =
  | 'sell'
  | 'discount'
  | 'edit_products'
  | 'edit_stock'
  | 'manage_orders'
  | 'manage_staff'
  | 'manage_settings'
  | 'view_reports'
  | 'view_customers';

const PERMISSIONS: Record<Role, Permission[]> = {
  owner: ['sell', 'discount', 'edit_products', 'edit_stock', 'manage_orders', 'manage_staff', 'manage_settings', 'view_reports', 'view_customers'],
  manager: ['sell', 'discount', 'edit_products', 'edit_stock', 'manage_orders', 'view_reports', 'view_customers'],
  sales: ['sell', 'manage_orders', 'view_customers'],
};

export function can(role: Role | undefined | null, permission: Permission) {
  return !!role && PERMISSIONS[role].includes(permission);
}

/** For pages: sends the visitor to the staff sign-in page if not allowed. */
export async function requireStaff(permission?: Permission) {
  const staff = await currentStaff();
  if (!staff) redirect('/staff/login');
  if (permission && !can(staff.role, permission)) redirect('/admin?denied=1');
  return staff;
}

/** For server actions and API routes: throws instead of redirecting. */
export async function assertStaff(permission?: Permission) {
  const staff = await currentStaff();
  if (!staff) throw new Error('Your session has ended. Sign in again.');
  if (permission && !can(staff.role, permission)) throw new Error('Your account is not allowed to do this. Ask the store owner.');
  return staff;
}

/* --------------------------------------------------------------- customer */

export async function startCustomerSession(customerId: string) {
  (await cookies()).set(CUSTOMER_COOKIE, await sign({ sub: customerId }, 60), cookieOptions(60));
}

export async function endCustomerSession() {
  (await cookies()).delete(CUSTOMER_COOKIE);
}

export async function currentCustomer() {
  const payload = await read(CUSTOMER_COOKIE);
  if (!payload?.sub) return null;
  return getCustomer(payload.sub);
}
