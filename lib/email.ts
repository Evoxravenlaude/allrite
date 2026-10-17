import 'server-only';
import { getSettings } from './store';
import { naira, STATUS_LABEL } from './format';
import type { Order } from './types';

/**
 * Sends email through Resend when RESEND_API_KEY and EMAIL_FROM are set.
 * Without them, emails are written to the server log so nothing breaks in demo mode.
 */
export async function sendEmail(to: string, subject: string, html: string) {
  if (!to) return;
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) {
    console.log(`[email not sent: no RESEND_API_KEY] to=${to} subject="${subject}"`);
    return;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject, html }),
    });
    if (!res.ok) console.error('Email failed', res.status, await res.text());
  } catch (err) {
    console.error('Email failed', err);
  }
}

function itemsTable(order: Order) {
  return `<table style="width:100%;border-collapse:collapse;font-size:14px">${order.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 0">${i.name}${i.size ? `, ${i.size}` : ''}${i.colour ? `, ${i.colour}` : ''} × ${i.qty}</td><td style="text-align:right">${naira(
          i.price * i.qty,
        )}</td></tr>`,
    )
    .join('')}</table>`;
}

function shell(storeName: string, body: string) {
  return `<div style="font-family:Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;color:#000">
    <p style="font-family:Georgia,serif;font-size:22px;letter-spacing:4px;margin:24px 0">ALLRITE</p>${body}
    <p style="color:#6E6B65;font-size:12px;margin-top:32px">${storeName}</p></div>`;
}

export async function emailOrderConfirmation(order: Order, siteUrl: string) {
  const s = await getSettings();
  const balance = order.total - order.amount_paid;
  await sendEmail(
    order.email,
    `Your Allrite order ${order.number}`,
    shell(
      s.storeName,
      `<p>Thank you, ${order.customer_name || 'and welcome'}. We have received your order ${order.number}.</p>
       ${itemsTable(order)}
       <p style="font-size:14px">Total ${naira(order.total)}. Paid ${naira(order.amount_paid)}.${
         balance > 0 ? ` Balance of ${naira(balance)} due before delivery.` : ''
       }</p>
       <p style="font-size:14px">${order.fulfilment === 'collection' ? `Collect from ${s.address}.` : `Delivering to ${order.address}.`}</p>
       <p><a href="${siteUrl}/order/${order.number}?e=${encodeURIComponent(order.email)}">Follow your order</a></p>`,
    ),
  );
}

export async function emailStatusUpdate(order: Order, siteUrl: string) {
  const s = await getSettings();
  await sendEmail(
    order.email,
    `Order ${order.number}: ${STATUS_LABEL[order.status]}`,
    shell(
      s.storeName,
      `<p>Your order ${order.number} is now: <strong>${STATUS_LABEL[order.status]}</strong>.</p>
       <p><a href="${siteUrl}/order/${order.number}?e=${encodeURIComponent(order.email)}">Follow your order</a></p>`,
    ),
  );
}

export async function emailReceipt(order: Order) {
  const s = await getSettings();
  await sendEmail(
    order.email,
    `Your Allrite receipt ${order.number}`,
    shell(
      s.storeName,
      `<p>Receipt ${order.number}</p>${itemsTable(order)}
       ${order.discount ? `<p style="font-size:14px">Discount ${naira(order.discount)}</p>` : ''}
       <p style="font-size:14px"><strong>Total ${naira(order.total)}</strong></p>
       <p style="font-size:13px;color:#6E6B65">${s.receiptFooter}</p>`,
    ),
  );
}

export async function emailNewViewing(details: { product: string; name: string; when: string; phone: string; email: string }) {
  const s = await getSettings();
  await sendEmail(
    process.env.STORE_NOTIFY_EMAIL || s.email,
    `Viewing request: ${details.product}`,
    shell(s.storeName, `<p>${details.name} would like to view ${details.product} on ${details.when}.</p><p>${details.phone}<br>${details.email}</p>`),
  );
}
