export function naira(amount: number): string {
  return '₦' + Math.round(amount).toLocaleString('en-NG');
}

export function dateTime(value: string | Date | null | undefined): string {
  if (!value) return '';
  const d = typeof value === 'string' ? new Date(value) : value;
  return d.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Lagos',
  });
}

export function dateOnly(value: string | Date | null | undefined): string {
  if (!value) return '';
  const d = typeof value === 'string' ? new Date(value) : value;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Lagos' });
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-');
}

/** Builds a valid EAN-13 barcode from a 12-digit body. */
export function ean13(body12: string): string {
  const digits = body12.padStart(12, '0').slice(-12).split('').map(Number);
  const sum = digits.reduce((acc, d, i) => acc + d * (i % 2 === 0 ? 1 : 3), 0);
  const check = (10 - (sum % 10)) % 10;
  return digits.join('') + String(check);
}

export const STATUS_LABEL: Record<string, string> = {
  awaiting_payment: 'Awaiting payment',
  received: 'Received',
  preparing: 'Being prepared',
  sent: 'Sent out',
  delivered: 'Delivered',
  collected: 'Collected',
  cancelled: 'Cancelled',
};

export const PAYMENT_LABEL: Record<string, string> = {
  paystack: 'Online (Paystack)',
  cash: 'Cash',
  transfer: 'Bank transfer',
  pos_card: 'Card on POS',
};

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  unpaid: 'Unpaid',
  deposit_paid: 'Deposit paid',
  paid: 'Paid in full',
  refunded: 'Refunded',
};

export const CHANNEL_LABEL: Record<string, string> = {
  online: 'Online',
  counter: 'Counter',
  showroom: 'Showroom',
};

/** Status wording depends on whether the order is delivered or collected. */
export function statusLabel(status: string, fulfilment: string) {
  if (fulfilment === 'collection' && status === 'sent') return 'Ready to collect';
  return STATUS_LABEL[status] ?? status;
}

export function orderSteps(fulfilment: string) {
  return fulfilment === 'collection'
    ? ['received', 'preparing', 'sent', 'collected']
    : fulfilment === 'in_store'
      ? ['collected']
      : ['received', 'preparing', 'sent', 'delivered'];
}

/** Payment method as it reads after "by": "paid by card on the POS machine". */
export const PAYMENT_PHRASE: Record<string, string> = {
  paystack: 'online payment through Paystack',
  cash: 'cash',
  transfer: 'bank transfer',
  pos_card: 'card on the POS machine',
};
