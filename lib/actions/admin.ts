'use server';

import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { assertStaff } from '@/lib/auth';
import {
  adjustStock,
  cancelOrder,
  createStaff,
  deleteProduct,
  deleteZone,
  getOrder,
  saveProduct,
  saveSettings,
  saveZone,
  setOrderNote,
  setOrderStatus,
  setViewingStatus,
  settleAtCounter,
  setCustomerPassword,
  updateStaff,
  type ProductInput,
} from '@/lib/store';
import { emailStatusUpdate } from '@/lib/email';
import { siteUrl } from '@/lib/site';
import type { Order, Role, StoreSettings } from '@/lib/types';

export type ActionResult = { error?: string; ok?: string; id?: string; slug?: string };

async function run(fn: () => Promise<ActionResult | void>): Promise<ActionResult> {
  try {
    return (await fn()) ?? { ok: 'Saved.' };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Something went wrong.' };
  }
}

/* --------------------------------------------------------------- products */

export async function saveProductAction(input: ProductInput): Promise<ActionResult> {
  return run(async () => {
    const staff = await assertStaff('edit_products');
    if (!input.name.trim()) throw new Error('Give the product a name.');
    if (!input.category.trim()) throw new Error('Choose or type a category.');
    if (!(input.price > 0)) throw new Error('Enter a price above zero.');
    if (input.variants.length === 0) throw new Error('Add at least one size, colour or finish.');
    for (const v of input.variants) {
      if (!/^\d{6,14}$/.test(v.barcode)) throw new Error(`Barcode "${v.barcode}" must be 6 to 14 digits.`);
      if (v.stock < 0) throw new Error('Stock cannot be below zero.');
    }
    const { id, slug } = await saveProduct(input, staff.id);
    revalidatePath('/', 'layout');
    return { ok: 'Product saved. It is live on the website and both store screens.', id, slug };
  });
}

export async function deleteProductAction(id: string): Promise<ActionResult> {
  return run(async () => {
    await assertStaff('edit_products');
    const result = await deleteProduct(id);
    revalidatePath('/', 'layout');
    return {
      ok: result === 'hidden' ? 'This product has past sales, so it was hidden from the shop instead of deleted.' : 'Product deleted.',
    };
  });
}

/* ------------------------------------------------------------------ stock */

export async function restockAction(variantId: string, quantity: number): Promise<ActionResult> {
  return run(async () => {
    const staff = await assertStaff('edit_stock');
    if (!Number.isInteger(quantity) || quantity === 0) throw new Error('Enter a whole number of pieces.');
    const stock = await adjustStock(variantId, quantity, quantity > 0 ? 'restock' : 'adjustment', staff.id);
    revalidatePath('/admin/stock');
    return { ok: `Stock is now ${stock}.` };
  });
}

export async function setStockAction(variantId: string, current: number, count: number): Promise<ActionResult> {
  return run(async () => {
    const staff = await assertStaff('edit_stock');
    if (!Number.isInteger(count) || count < 0) throw new Error('Enter a count of zero or more.');
    const stock = await adjustStock(variantId, count - current, 'adjustment', staff.id);
    revalidatePath('/admin/stock');
    return { ok: `Stock is now ${stock}.` };
  });
}

/* ----------------------------------------------------------------- orders */

export async function orderStatusAction(orderId: string, status: Order['status'], notify: boolean): Promise<ActionResult> {
  return run(async () => {
    await assertStaff('manage_orders');
    await setOrderStatus(orderId, status);
    const order = await getOrder(orderId);
    if (notify && order?.email && order.channel !== 'counter') await emailStatusUpdate(order, await siteUrl());
    revalidatePath('/admin/orders');
    revalidatePath(`/admin/orders/${orderId}`);
    const emailed = notify && !!order?.email && order.channel !== 'counter';
    if (emailed && !process.env.RESEND_API_KEY) return { ok: 'Status updated. Customer emails start once the email service is connected.' };
    return { ok: emailed ? 'Status updated and the customer has been emailed.' : 'Status updated.' };
  });
}

export async function cancelOrderAction(orderId: string): Promise<ActionResult> {
  return run(async () => {
    const staff = await assertStaff('edit_stock');
    await cancelOrder(orderId, staff.id);
    revalidatePath('/admin/orders');
    revalidatePath(`/admin/orders/${orderId}`);
    return { ok: 'Order cancelled and its pieces are back in stock. Refund any payment from the Paystack dashboard or in the store.' };
  });
}

export async function orderNoteAction(orderId: string, note: string): Promise<ActionResult> {
  return run(async () => {
    await assertStaff('manage_orders');
    await setOrderNote(orderId, note);
    revalidatePath(`/admin/orders/${orderId}`);
    return { ok: 'Note saved.' };
  });
}

export async function settleOrderAction(orderId: string, method: 'cash' | 'transfer' | 'pos_card'): Promise<ActionResult> {
  return run(async () => {
    const staff = await assertStaff('sell');
    await settleAtCounter(orderId, method, staff.id);
    revalidatePath(`/admin/orders/${orderId}`);
    return { ok: 'Payment recorded. The order is now paid in full.' };
  });
}

/* --------------------------------------------------------------- viewings */

export async function viewingStatusAction(id: string, status: string): Promise<ActionResult> {
  return run(async () => {
    await assertStaff('manage_orders');
    await setViewingStatus(id, status);
    revalidatePath('/admin/viewings');
  });
}

/* ------------------------------------------------------------------ staff */

export async function createStaffAction(_: ActionResult | undefined, form: FormData): Promise<ActionResult> {
  return run(async () => {
    await assertStaff('manage_staff');
    const name = String(form.get('name') ?? '').trim();
    const email = String(form.get('email') ?? '').trim();
    const role = String(form.get('role')) as Role;
    const password = String(form.get('password') ?? '');
    if (name.length < 2) throw new Error('Enter the staff member’s name.');
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Enter a valid email address.');
    if (!['owner', 'manager', 'sales'].includes(role)) throw new Error('Choose a role.');
    if (password.length < 8) throw new Error('Choose a password of at least 8 characters.');
    try {
      await createStaff({ name, email, role, passwordHash: await bcrypt.hash(password, 10) });
    } catch {
      throw new Error('A staff account with this email already exists.');
    }
    revalidatePath('/admin/staff');
    return { ok: `${name} can now sign in.` };
  });
}

export async function updateStaffAction(id: string, changes: { role?: Role; active?: boolean; password?: string }): Promise<ActionResult> {
  return run(async () => {
    const me = await assertStaff('manage_staff');
    if (id === me.id && (changes.active === false || (changes.role && changes.role !== 'owner'))) {
      throw new Error('You cannot remove your own owner access.');
    }
    if (changes.password !== undefined && changes.password.length < 8) throw new Error('Choose a password of at least 8 characters.');
    await updateStaff(id, {
      role: changes.role,
      active: changes.active,
      passwordHash: changes.password ? await bcrypt.hash(changes.password, 10) : undefined,
    });
    revalidatePath('/admin/staff');
    return { ok: changes.password ? 'Password changed.' : 'Saved.' };
  });
}

/* --------------------------------------------------------------- settings */

export async function saveSettingsAction(_: ActionResult | undefined, form: FormData): Promise<ActionResult> {
  return run(async () => {
    await assertStaff('manage_settings');
    const text = (k: string) => String(form.get(k) ?? '').trim();
    const depositPercent = Number(form.get('depositPercent'));
    const reserveMinutes = Number(form.get('reserveMinutes'));
    if (!(depositPercent >= 10 && depositPercent <= 90)) throw new Error('Set the deposit between 10% and 90%.');
    if (!(reserveMinutes >= 10 && reserveMinutes <= 240)) throw new Error('Hold unpaid orders for between 10 and 240 minutes.');
    const values: Partial<StoreSettings> = {
      storeName: text('storeName'),
      address: text('address'),
      city: text('city'),
      phone: text('phone'),
      whatsapp: text('whatsapp').replace(/\D/g, ''),
      email: text('email'),
      hours: text('hours'),
      receiptFooter: text('receiptFooter'),
      depositPercent,
      reserveMinutes,
    };
    await saveSettings(values);
    revalidatePath('/', 'layout');
    return { ok: 'Store details saved.' };
  });
}

export async function saveZoneAction(zone: { id?: string; name: string; fashion_fee: number; furniture_fee: number; active: boolean }): Promise<ActionResult> {
  return run(async () => {
    await assertStaff('manage_settings');
    if (!zone.name.trim()) throw new Error('Name the delivery area.');
    if (zone.fashion_fee < 0 || zone.furniture_fee < 0) throw new Error('Delivery prices cannot be negative.');
    await saveZone(zone);
    revalidatePath('/', 'layout');
    return { ok: 'Delivery area saved.' };
  });
}

export async function deleteZoneAction(id: string): Promise<ActionResult> {
  return run(async () => {
    await assertStaff('manage_settings');
    await deleteZone(id);
    revalidatePath('/', 'layout');
    return { ok: 'Delivery area removed.' };
  });
}

export async function customerPasswordAction(customerId: string, password: string): Promise<ActionResult> {
  return run(async () => {
    await assertStaff('discount');
    if (password.length < 8) throw new Error('Choose a password of at least 8 characters.');
    await setCustomerPassword(customerId, await bcrypt.hash(password, 10));
    return { ok: 'New password set. Share it with the customer privately and ask them to keep it safe.' };
  });
}
