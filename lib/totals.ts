import type { DeliveryZone, Department } from './types';

export type Totals = {
  subtotal: number;
  deliveryFee: number;
  total: number;
  dueNow: number;
  balance: number;
  depositEligible: boolean;
};

export function computeTotals(
  items: { department: Department; price: number; qty: number; allow_deposit?: boolean }[],
  zone: DeliveryZone | null,
  fulfilment: 'delivery' | 'collection' | 'in_store',
  payDeposit: boolean,
  depositPercent: number,
  discount = 0,
): Totals {
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const hasFashion = items.some((i) => i.department === 'fashion');
  const hasFurniture = items.some((i) => i.department === 'furniture');
  const deliveryFee =
    fulfilment === 'delivery' && zone ? (hasFashion ? zone.fashion_fee : 0) + (hasFurniture ? zone.furniture_fee : 0) : 0;
  const total = Math.max(0, subtotal + deliveryFee - discount);
  const depositable = items.filter((i) => i.department === 'furniture' && i.allow_deposit).reduce((s, i) => s + i.price * i.qty, 0);
  const depositEligible = depositable > 0;
  const balance = payDeposit && depositEligible ? Math.round(depositable * (1 - depositPercent / 100)) : 0;
  return { subtotal, deliveryFee, total, dueNow: total - balance, balance, depositEligible };
}

