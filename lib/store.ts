import 'server-only';
import { q, one, tx, type Query, type Row } from './db';
import { DEFAULT_SETTINGS } from './seed';
import { slugify } from './format';
import { computeTotals } from './totals';
export { computeTotals } from './totals';
import type {
  CartLine,
  DeliveryZone,
  Department,
  Order,
  PaymentMethod,
  Product,
  ProductImage,
  Role,
  StoreSettings,
  Variant,
} from './types';

/* ----------------------------------------------------------------- helpers */

function ser<T = Row>(row: Row): T {
  const out: Row = {};
  for (const [k, v] of Object.entries(row)) out[k] = v instanceof Date ? v.toISOString() : v;
  return out as T;
}

export class StockError extends Error {
  constructor(public itemName: string, public available: number) {
    super(available > 0 ? `Only ${available} of ${itemName} left in stock.` : `${itemName} has just sold out.`);
  }
}

/* --------------------------------------------------------------- settings */

export async function getSettings(): Promise<StoreSettings> {
  const row = await one(`select value from settings where key = 'store'`);
  return { ...DEFAULT_SETTINGS, ...(row?.value ?? {}) };
}

export async function saveSettings(values: Partial<StoreSettings>) {
  const merged = { ...(await getSettings()), ...values };
  await q(
    `insert into settings (key, value) values ('store', $1::text::jsonb) on conflict (key) do update set value = excluded.value`,
    [JSON.stringify(merged)],
  );
  return merged;
}

export async function listZones(includeInactive = false): Promise<DeliveryZone[]> {
  const rows = await q(
    `select * from delivery_zones ${includeInactive ? '' : 'where active'} order by sort, name`,
  );
  return rows.map((r) => ser<DeliveryZone>(r));
}

export async function saveZone(z: Partial<DeliveryZone> & { name: string }) {
  if (z.id) {
    await q(
      `update delivery_zones set name=$2, fashion_fee=$3, furniture_fee=$4, active=$5, sort=$6 where id=$1`,
      [z.id, z.name, z.fashion_fee ?? 0, z.furniture_fee ?? 0, z.active ?? true, z.sort ?? 0],
    );
  } else {
    await q(`insert into delivery_zones (name, fashion_fee, furniture_fee, active, sort) values ($1,$2,$3,$4,$5)`, [
      z.name, z.fashion_fee ?? 0, z.furniture_fee ?? 0, z.active ?? true, z.sort ?? 99,
    ]);
  }
}

export async function deleteZone(id: string) {
  await q(`delete from delivery_zones where id = $1`, [id]);
}

/* --------------------------------------------------------------- products */

const PRODUCT_COLUMNS = `p.id, p.slug, p.department, p.category, p.name, p.description, p.details, p.care, p.price, p.images,
  p.width_cm, p.depth_cm, p.height_cm, p.materials, p.finishes, p.availability, p.lead_time_weeks, p.allow_deposit,
  p.is_new, p.published, p.created_at`;

async function attachVariants(rows: Row[]): Promise<Product[]> {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const variants = await q(`select * from variants where product_id = any(string_to_array($1, ',')::uuid[]) order by sort, size`, [ids.join(',')]);
  const byProduct = new Map<string, Variant[]>();
  for (const v of variants) {
    const list = byProduct.get(v.product_id) ?? [];
    list.push(ser<Variant>(v));
    byProduct.set(v.product_id, list);
  }
  return rows.map((r) => ({ ...ser<Product>(r), variants: byProduct.get(r.id) ?? [] }));
}

export type ProductFilter = {
  department?: Department;
  category?: string;
  search?: string;
  newOnly?: boolean;
  size?: string;
  colour?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: 'new' | 'price-asc' | 'price-desc' | 'name';
  includeUnpublished?: boolean;
  limit?: number;
};

export async function listProducts(f: ProductFilter = {}): Promise<Product[]> {
  const where: string[] = [];
  const params: unknown[] = [];
  const add = (sql: string, value: unknown) => {
    params.push(value);
    where.push(sql.replaceAll('$?', `$${params.length}`));
  };
  if (!f.includeUnpublished) where.push('p.published');
  if (f.department) add('p.department = $?', f.department);
  if (f.category) add('p.category = $?', f.category);
  if (f.newOnly) where.push('p.is_new');
  if (f.minPrice) add('p.price >= $?', f.minPrice);
  if (f.maxPrice) add('p.price <= $?', f.maxPrice);
  if (f.search) {
    add(`(p.name ilike $? or p.category ilike $? or p.description ilike $? or p.materials ilike $?)`, `%${f.search}%`);
  }
  if (f.size) add('exists (select 1 from variants v where v.product_id = p.id and v.size = $?)', f.size);
  if (f.colour) add('exists (select 1 from variants v where v.product_id = p.id and v.colour = $?)', f.colour);
  if (f.inStock) where.push(`(p.availability = 'made_to_order' or exists (select 1 from variants v where v.product_id = p.id and v.stock > 0))`);
  const order =
    f.sort === 'price-asc' ? 'p.price asc' : f.sort === 'price-desc' ? 'p.price desc' : f.sort === 'name' ? 'p.name asc' : 'p.created_at desc';
  const rows = await q(
    `select ${PRODUCT_COLUMNS} from products p ${where.length ? 'where ' + where.join(' and ') : ''} order by ${order} ${
      f.limit ? `limit ${Number(f.limit)}` : ''
    }`,
    params,
  );
  return attachVariants(rows);
}

export async function getProductBySlug(slug: string, includeUnpublished = false) {
  const rows = await q(
    `select ${PRODUCT_COLUMNS} from products p where p.slug = $1 ${includeUnpublished ? '' : 'and p.published'}`,
    [slug],
  );
  return (await attachVariants(rows))[0] ?? null;
}

export async function getProductById(id: string) {
  const rows = await q(`select ${PRODUCT_COLUMNS} from products p where p.id = $1`, [id]);
  return (await attachVariants(rows))[0] ?? null;
}

export async function listCategories(department?: Department) {
  const rows = await q(
    `select category, department, count(*)::int as n from products where published ${department ? 'and department = $1' : ''}
     group by category, department order by department, category`,
    department ? [department] : [],
  );
  return rows as { category: string; department: Department; n: number }[];
}

export async function listFacets(department?: Department) {
  const rows = await q(
    `select distinct v.size, v.colour from variants v join products p on p.id = v.product_id
     where p.published ${department ? 'and p.department = $1' : ''}`,
    department ? [department] : [],
  );
  const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One size'];
  const sizes = [...new Set(rows.map((r) => r.size).filter(Boolean))].sort((a, b) => {
    const ia = sizeOrder.indexOf(a), ib = sizeOrder.indexOf(b);
    if (ia >= 0 && ib >= 0) return ia - ib;
    if (ia >= 0) return -1;
    if (ib >= 0) return 1;
    return Number(a) - Number(b) || a.localeCompare(b);
  });
  const colours = [...new Set(rows.map((r) => r.colour).filter(Boolean))].sort();
  return { sizes, colours };
}

export type VariantWithProduct = Variant & {
  product_name: string;
  product_slug: string;
  department: Department;
  price: number;
  image: string | null;
  allow_deposit: boolean;
  availability: 'ready' | 'made_to_order';
};

const VARIANT_JOIN = `select v.*, p.name as product_name, p.slug as product_slug, p.department, p.price,
  p.images->0->>'url' as image, p.allow_deposit, p.availability
  from variants v join products p on p.id = v.product_id`;

export async function getVariants(ids: string[]): Promise<VariantWithProduct[]> {
  if (!ids.length) return [];
  const rows = await q(`${VARIANT_JOIN} where v.id = any(string_to_array($1, ',')::uuid[])`, [ids.join(',')]);
  return rows.map((r) => ser<VariantWithProduct>(r));
}

export async function getVariantByBarcode(code: string): Promise<VariantWithProduct | null> {
  const row = await one(`${VARIANT_JOIN} where v.barcode = $1`, [code.trim()]);
  return row ? ser<VariantWithProduct>(row) : null;
}

export async function stockLevels(productIds?: string[]) {
  const rows = productIds?.length
    ? await q(`select id, stock from variants where product_id = any(string_to_array($1, ',')::uuid[])`, [productIds.join(',')])
    : await q(`select id, stock from variants`);
  return Object.fromEntries(rows.map((r) => [r.id, r.stock])) as Record<string, number>;
}

export type ProductInput = {
  id?: string;
  department: Department;
  category: string;
  name: string;
  description: string;
  details: string;
  care: string;
  price: number;
  images: ProductImage[];
  width_cm?: number | null;
  depth_cm?: number | null;
  height_cm?: number | null;
  materials?: string;
  finishes?: string;
  availability?: 'ready' | 'made_to_order';
  lead_time_weeks?: number | null;
  allow_deposit?: boolean;
  is_new?: boolean;
  published?: boolean;
  variants: { id?: string; size: string; colour: string; barcode: string; stock: number; low_stock_at: number }[];
};

export async function saveProduct(input: ProductInput, staffId: string | null) {
  return tx(async (t) => {
    let id = input.id;
    let slug = slugify(input.name) || 'product';
    const clash = await t(`select id from products where slug = $1 ${id ? 'and id <> $2' : ''}`, id ? [slug, id] : [slug]);
    if (clash.length) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    const values = [
      slug, input.department, input.category, input.name, input.description, input.details, input.care, input.price,
      JSON.stringify(input.images), input.width_cm ?? null, input.depth_cm ?? null, input.height_cm ?? null,
      input.materials ?? '', input.finishes ?? '', input.availability ?? 'ready', input.lead_time_weeks ?? null,
      !!input.allow_deposit, !!input.is_new, input.published ?? true,
    ];
    if (id) {
      await t(
        `update products set slug=$1, department=$2, category=$3, name=$4, description=$5, details=$6, care=$7, price=$8,
          images=$9::text::jsonb, width_cm=$10, depth_cm=$11, height_cm=$12, materials=$13, finishes=$14, availability=$15,
          lead_time_weeks=$16, allow_deposit=$17, is_new=$18, published=$19, updated_at=now() where id=$20`,
        [...values, id],
      );
    } else {
      const [row] = await t(
        `insert into products (slug, department, category, name, description, details, care, price, images, width_cm,
          depth_cm, height_cm, materials, finishes, availability, lead_time_weeks, allow_deposit, is_new, published)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9::text::jsonb,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) returning id`,
        values,
      );
      id = row.id as string;
    }

    const existing = await t(`select id, stock from variants where product_id = $1`, [id]);
    const keep = new Set(input.variants.filter((v) => v.id).map((v) => v.id));
    for (const v of existing) {
      if (!keep.has(v.id)) await t(`delete from variants where id = $1`, [v.id]);
    }
    for (const [i, v] of input.variants.entries()) {
      const dup = await t(`select id from variants where barcode = $1 ${v.id ? 'and id <> $2' : ''}`, v.id ? [v.barcode, v.id] : [v.barcode]);
      if (dup.length) throw new Error(`Barcode ${v.barcode} is already used by another item.`);
      if (v.id) {
        const before = existing.find((e) => e.id === v.id);
        await t(`update variants set size=$2, colour=$3, barcode=$4, stock=$5, low_stock_at=$6, sort=$7 where id=$1`, [
          v.id, v.size, v.colour, v.barcode, v.stock, v.low_stock_at, i,
        ]);
        if (before && before.stock !== v.stock) {
          await t(`insert into stock_movements (variant_id, change, reason, staff_id) values ($1,$2,'adjustment',$3)`, [
            v.id, v.stock - before.stock, staffId,
          ]);
        }
      } else {
        const [nv] = await t(
          `insert into variants (product_id, size, colour, barcode, stock, low_stock_at, sort) values ($1,$2,$3,$4,$5,$6,$7) returning id`,
          [id, v.size, v.colour, v.barcode, v.stock, v.low_stock_at, i],
        );
        if (v.stock > 0) {
          await t(`insert into stock_movements (variant_id, change, reason, staff_id) values ($1,$2,'restock',$3)`, [nv.id, v.stock, staffId]);
        }
      }
    }
    return { id, slug };
  });
}

export async function deleteProduct(id: string) {
  const sold = await one(`select 1 from order_items where product_id = $1 limit 1`, [id]);
  if (sold) {
    await q(`update products set published = false where id = $1`, [id]);
    return 'hidden' as const;
  }
  await q(`delete from products where id = $1`, [id]);
  return 'deleted' as const;
}

export async function nextBarcode() {
  const row = await one(`select max(barcode) as m from variants where barcode like '2%' and length(barcode) = 13`);
  const body = row?.m ? String(BigInt(row.m.slice(0, 12)) + 1n) : '200000000001';
  const { ean13 } = await import('./format');
  return ean13(body);
}

/* ------------------------------------------------------------------ stock */

export async function adjustStock(variantId: string, change: number, reason: 'restock' | 'adjustment', staffId: string | null) {
  return tx(async (t) => {
    const rows = await t(`update variants set stock = stock + $2 where id = $1 and stock + $2 >= 0 returning stock`, [variantId, change]);
    if (!rows.length) throw new Error('Stock cannot go below zero.');
    await t(`insert into stock_movements (variant_id, change, reason, staff_id) values ($1,$2,$3,$4)`, [variantId, change, reason, staffId]);
    return rows[0].stock as number;
  });
}

export async function lowStock() {
  const rows = await q(
    `select v.id, v.size, v.colour, v.barcode, v.stock, v.low_stock_at, p.name, p.slug, p.department, p.id as product_id, p.availability
     from variants v join products p on p.id = v.product_id
     where p.published and p.availability = 'ready' and v.stock <= v.low_stock_at order by v.stock, p.name`,
  );
  return rows.map((r) => ser(r));
}

export async function allStock() {
  const rows = await q(
    `select v.id, v.size, v.colour, v.barcode, v.stock, v.low_stock_at, p.name, p.department, p.category, p.price, p.id as product_id
     from variants v join products p on p.id = v.product_id order by p.department, p.name, v.sort`,
  );
  return rows.map((r) => ser(r));
}

/* ----------------------------------------------------------------- orders */

async function reserveLines(t: Query, lines: CartLine[], orderId: string, staffId: string | null, reason: 'reserve' | 'sale') {
  const merged = new Map<string, number>();
  for (const l of lines) merged.set(l.variantId, (merged.get(l.variantId) ?? 0) + l.qty);
  const ids = [...merged.keys()];
  const rows = await t(
    `select v.id, v.size, v.colour, v.stock, p.id as product_id, p.name, p.price, p.department, p.allow_deposit, p.availability
     from variants v join products p on p.id = v.product_id where v.id = any(string_to_array($1, ',')::uuid[]) for update of v`,
    [ids.join(',')],
  );
  const items: Row[] = [];
  for (const id of ids) {
    const r = rows.find((x) => x.id === id);
    const qty = merged.get(id)!;
    if (!r) throw new Error('An item in the bag is no longer available.');
    const label = [r.name, r.size, r.colour].filter(Boolean).join(', ');
    // Made-to-order pieces are built after the order, so they never run out.
    if (r.availability !== 'made_to_order') {
      const updated = await t(`update variants set stock = stock - $2 where id = $1 and stock >= $2 returning stock`, [id, qty]);
      if (!updated.length) throw new StockError(label, r.stock);
      await t(`insert into stock_movements (variant_id, change, reason, order_id, staff_id) values ($1,$2,$3,$4,$5)`, [
        id, -qty, reason, orderId, staffId,
      ]);
    }
    items.push({ ...r, qty });
  }
  return items;
}

async function insertItems(t: Query, orderId: string, items: Row[]) {
  for (const it of items) {
    await t(
      `insert into order_items (order_id, product_id, variant_id, department, name, size, colour, price, qty) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [orderId, it.product_id, it.id, it.department, it.name, it.size, it.colour, it.price, it.qty],
    );
  }
}

async function restoreStock(t: Query, orderId: string, staffId: string | null) {
  const items = await t(
    `select oi.variant_id, oi.qty, p.availability from order_items oi left join products p on p.id = oi.product_id where oi.order_id = $1`,
    [orderId],
  );
  for (const it of items) {
    if (!it.variant_id || it.availability === 'made_to_order') continue;
    await t(`update variants set stock = stock + $2 where id = $1`, [it.variant_id, it.qty]);
    await t(`insert into stock_movements (variant_id, change, reason, order_id, staff_id) values ($1,$2,'release',$3,$4)`, [
      it.variant_id, it.qty, orderId, staffId,
    ]);
  }
}

/** Unpaid online orders hold their stock for a short time; after that the stock goes back on sale. */
export async function releaseExpiredOrders() {
  const expired = await q(
    `select id from orders where status = 'awaiting_payment' and payment_status = 'unpaid' and expires_at is not null and expires_at < now()`,
  );
  for (const o of expired) {
    await tx(async (t) => {
      const [row] = await t(
        `update orders set status = 'cancelled', note = trim(note || ' Payment not completed in time; stock released.')
         where id = $1 and status = 'awaiting_payment' and payment_status = 'unpaid' returning id`,
        [o.id],
      );
      if (row) await restoreStock(t, o.id, null);
    });
  }
  return expired.length;
}

export type CustomerDetails = {
  name: string;
  email: string;
  phone: string;
  customerId?: string | null;
};

export async function createOnlineOrder(input: {
  lines: CartLine[];
  customer: CustomerDetails;
  fulfilment: 'delivery' | 'collection';
  zoneId: string | null;
  address: string;
  isGift: boolean;
  giftMessage: string;
  payDeposit: boolean;
}) {
  await releaseExpiredOrders();
  const settings = await getSettings();
  const zones = await listZones();
  const zone = input.fulfilment === 'delivery' ? zones.find((z) => z.id === input.zoneId) ?? null : null;
  if (input.fulfilment === 'delivery' && !zone) throw new Error('Choose a delivery area.');
  return tx(async (t) => {
    const customerId = input.customer.customerId ?? (await ensureCustomer(t, input.customer));
    const [order] = await t(
      `insert into orders (channel, status, customer_id, customer_name, email, phone, fulfilment, zone_id, zone_name, address,
         is_gift, gift_message, pay_deposit, expires_at)
       values ('online','awaiting_payment',$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, now() + make_interval(mins => $12::int)) returning id, number`,
      [
        customerId, input.customer.name, input.customer.email.toLowerCase(), input.customer.phone, input.fulfilment,
        zone?.id ?? null, zone?.name ?? '', input.address, input.isGift, input.giftMessage, input.payDeposit, settings.reserveMinutes,
      ],
    );
    const items = await reserveLines(t, input.lines, order.id, null, 'reserve');
    await insertItems(t, order.id, items);
    const totals = computeTotals(items as never, zone, input.fulfilment, input.payDeposit, settings.depositPercent);
    await t(`update orders set subtotal=$2, delivery_fee=$3, total=$4, pay_deposit=$5 where id=$1`, [
      order.id, totals.subtotal, totals.deliveryFee, totals.total, input.payDeposit && totals.depositEligible,
    ]);
    return { id: order.id as string, number: order.number as string, totals };
  });
}

async function ensureCustomer(t: Query, c: CustomerDetails): Promise<string | null> {
  const email = c.email.trim().toLowerCase();
  if (!email) return null;
  const [row] = await t(
    `insert into customers (email, name, phone) values ($1,$2,$3)
     on conflict (email) do update set name = case when customers.name = '' then excluded.name else customers.name end,
       phone = case when customers.phone = '' then excluded.phone else customers.phone end
     returning id`,
    [email, c.name, c.phone],
  );
  return row.id;
}

export async function createPayment(orderId: string, kind: 'initial' | 'balance', amount: number) {
  const reference = `AR${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`.toUpperCase();
  await q(`insert into payments (order_id, kind, reference, amount) values ($1,$2,$3,$4)`, [orderId, kind, reference, amount]);
  return reference;
}

export async function getPayment(reference: string) {
  const row = await one(`select * from payments where reference = $1`, [reference]);
  return row ? ser(row) : null;
}

/** Called once Paystack confirms a payment. Safe to call more than once for the same reference. */
export async function confirmPayment(reference: string, amountPaid: number) {
  return tx(async (t) => {
    const [pay] = await t(`select * from payments where reference = $1 for update`, [reference]);
    if (!pay) throw new Error('Unknown payment reference.');
    if (pay.status === 'success') return { orderId: pay.order_id as string, already: true };
    if (amountPaid < pay.amount) {
      await t(`update payments set status = 'failed' where id = $1`, [pay.id]);
      throw new Error('Amount paid is lower than the amount due.');
    }
    await t(`update payments set status = 'success' where id = $1`, [pay.id]);
    const [order] = await t(`select * from orders where id = $1 for update`, [pay.order_id]);
    let note = order.note as string;
    if (order.status === 'cancelled' && pay.kind === 'initial') {
      // The reservation ran out before payment arrived. Try to take the stock again.
      try {
        await reserveLines(
          t,
          (await t(`select variant_id as "variantId", qty from order_items where order_id = $1`, [order.id])) as CartLine[],
          order.id,
          null,
          'reserve',
        );
        note = `${note} Stock taken again after a late payment.`.trim();
      } catch {
        note = `${note} PAID AFTER STOCK WAS RELEASED: an item is no longer available. Contact the customer and arrange a refund or alternative.`.trim();
      }
    }
    const amount = order.amount_paid + pay.amount;
    const paymentStatus = amount >= order.total ? 'paid' : 'deposit_paid';
    const status = order.status === 'awaiting_payment' || order.status === 'cancelled' ? 'received' : order.status;
    await t(
      `update orders set amount_paid = $2, payment_status = $3, status = $4, payment_method = 'paystack',
         paid_at = coalesce(paid_at, now()), expires_at = null, note = $5 where id = $1`,
      [order.id, amount, paymentStatus, status, note],
    );
    if (pay.kind === 'initial') {
      await t(`update stock_movements set reason = 'sale' where order_id = $1 and reason = 'reserve'`, [order.id]);
    }
    return { orderId: order.id as string, already: false };
  });
}

export async function createCounterSale(input: {
  lines: CartLine[];
  method: Exclude<PaymentMethod, 'paystack'>;
  discount: number;
  staffId: string;
  customer: CustomerDetails;
}) {
  return tx(async (t) => {
    const customerId = await ensureCustomer(t, input.customer);
    const [order] = await t(
      `insert into orders (channel, status, payment_status, payment_method, customer_id, customer_name, email, phone, fulfilment, staff_id, paid_at)
       values ('counter','collected','paid',$1,$2,$3,$4,$5,'in_store',$6, now()) returning id, number`,
      [input.method, customerId, input.customer.name, input.customer.email.toLowerCase(), input.customer.phone, input.staffId],
    );
    const items = await reserveLines(t, input.lines, order.id, input.staffId, 'sale');
    await insertItems(t, order.id, items);
    const totals = computeTotals(items as never, null, 'in_store', false, 0, input.discount);
    await t(`update orders set subtotal=$2, discount=$3, total=$4, amount_paid=$4 where id=$1`, [
      order.id, totals.subtotal, input.discount, totals.total,
    ]);
    return { id: order.id as string, number: order.number as string };
  });
}

export async function createShowroomOrder(input: {
  lines: CartLine[];
  staffId: string;
  customer: CustomerDetails;
  fulfilment: 'delivery' | 'collection' | 'in_store';
  zoneId: string | null;
  address: string;
  note: string;
}) {
  const zones = await listZones();
  const zone = input.fulfilment === 'delivery' ? zones.find((z) => z.id === input.zoneId) ?? null : null;
  if (input.fulfilment === 'delivery' && !zone) throw new Error('Choose a delivery area.');
  return tx(async (t) => {
    const customerId = await ensureCustomer(t, input.customer);
    const [order] = await t(
      `insert into orders (channel, status, customer_id, customer_name, email, phone, fulfilment, zone_id, zone_name, address, staff_id, note)
       values ('showroom','awaiting_payment',$1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning id, number`,
      [
        customerId, input.customer.name, input.customer.email.toLowerCase(), input.customer.phone, input.fulfilment,
        zone?.id ?? null, zone?.name ?? '', input.address, input.staffId, input.note,
      ],
    );
    const items = await reserveLines(t, input.lines, order.id, input.staffId, 'reserve');
    await insertItems(t, order.id, items);
    const totals = computeTotals(items as never, zone, input.fulfilment, false, 0);
    await t(`update orders set subtotal=$2, delivery_fee=$3, total=$4 where id=$1`, [order.id, totals.subtotal, totals.deliveryFee, totals.total]);
    return { id: order.id as string, number: order.number as string };
  });
}

/** Takes payment at the counter for an order placed from the showroom screen, or the balance on a furniture order. */
export async function settleAtCounter(orderId: string, method: Exclude<PaymentMethod, 'paystack'>, staffId: string) {
  return tx(async (t) => {
    const [order] = await t(`select * from orders where id = $1 for update`, [orderId]);
    if (!order) throw new Error('Order not found.');
    if (order.status === 'cancelled') throw new Error('This order was cancelled.');
    if (order.payment_status === 'paid') throw new Error('This order is already paid.');
    const status = order.fulfilment === 'in_store' ? 'collected' : order.status === 'awaiting_payment' ? 'received' : order.status;
    await t(
      `update orders set payment_status='paid', amount_paid=total, payment_method = coalesce(payment_method, $2), status=$3,
         paid_at = coalesce(paid_at, now()), expires_at = null, staff_id = coalesce(staff_id, $4) where id=$1`,
      [orderId, method, status, staffId],
    );
    await t(`update stock_movements set reason = 'sale' where order_id = $1 and reason = 'reserve'`, [orderId]);
  });
}

export async function cancelOrder(orderId: string, staffId: string | null) {
  return tx(async (t) => {
    const [order] = await t(`select status, payment_status from orders where id = $1 for update`, [orderId]);
    if (!order) throw new Error('Order not found.');
    if (order.status === 'cancelled') return;
    await t(`update orders set status = 'cancelled', expires_at = null where id = $1`, [orderId]);
    await restoreStock(t, orderId, staffId);
  });
}

export async function setOrderStatus(orderId: string, status: Order['status']) {
  if (status === 'cancelled') throw new Error('Use cancel to cancel an order.');
  await q(`update orders set status = $2 where id = $1`, [orderId, status]);
}

export async function setOrderNote(orderId: string, note: string) {
  await q(`update orders set note = $2 where id = $1`, [orderId, note]);
}

async function attachItems(rows: Row[]): Promise<Order[]> {
  if (!rows.length) return [];
  const items = await q(`select * from order_items where order_id = any(string_to_array($1, ',')::uuid[]) order by name`, [rows.map((r) => r.id).join(',')]);
  return rows.map((r) => ({ ...ser<Order>(r), items: items.filter((i) => i.order_id === r.id).map((i) => ser(i)) as Order['items'] }));
}

export async function getOrder(id: string) {
  const rows = await q(`select o.*, s.name as staff_name from orders o left join staff s on s.id = o.staff_id where o.id = $1`, [id]);
  return (await attachItems(rows))[0] ?? null;
}

export async function getOrderByNumber(number: string) {
  const rows = await q(`select o.*, s.name as staff_name from orders o left join staff s on s.id = o.staff_id where o.number = $1`, [
    number.trim().toUpperCase(),
  ]);
  return (await attachItems(rows))[0] ?? null;
}

export async function listOrders(f: { status?: string; channel?: string; search?: string; from?: string; to?: string; limit?: number } = {}) {
  await releaseExpiredOrders();
  const where: string[] = [];
  const params: unknown[] = [];
  const add = (sql: string, v: unknown) => {
    params.push(v);
    where.push(sql.replaceAll('$?', `$${params.length}`));
  };
  if (f.status === 'open') where.push(`o.status in ('received','preparing','sent')`);
  else if (f.status === 'deposit') where.push(`o.payment_status = 'deposit_paid' and o.status <> 'cancelled'`);
  else if (f.status) add('o.status = $?', f.status);
  if (f.channel) add('o.channel = $?', f.channel);
  if (f.search) add(`(o.number ilike $? or o.customer_name ilike $? or o.email ilike $? or o.phone ilike $?)`, `%${f.search}%`);
  if (f.from) add(`o.created_at >= $?::timestamptz`, f.from);
  if (f.to) add(`o.created_at < $?::timestamptz`, f.to);
  const rows = await q(
    `select o.*, s.name as staff_name from orders o left join staff s on s.id = o.staff_id
     ${where.length ? 'where ' + where.join(' and ') : ''} order by o.created_at desc limit ${Number(f.limit ?? 200)}`,
    params,
  );
  return attachItems(rows);
}

export async function heldShowroomOrders() {
  const rows = await q(
    `select o.*, s.name as staff_name from orders o left join staff s on s.id = o.staff_id
     where o.channel = 'showroom' and o.status = 'awaiting_payment' order by o.created_at desc`,
  );
  return attachItems(rows);
}

export async function ordersForCustomer(customerId: string) {
  const rows = await q(`select * from orders where customer_id = $1 and channel = 'online' and not (status = 'cancelled' and payment_status = 'unpaid') order by created_at desc`, [customerId]);
  return attachItems(rows);
}

/* ---------------------------------------------------------------- reports */

/** Lagos is UTC+1 all year. */
export function lagosDayRange(day?: string) {
  const d = day ? new Date(`${day}T00:00:00+01:00`) : new Date(new Date().toLocaleString('en-US', { timeZone: 'Africa/Lagos' }));
  const iso = day ?? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const from = new Date(`${iso}T00:00:00+01:00`);
  const to = new Date(from.getTime() + 86400000);
  return { day: iso, from: from.toISOString(), to: to.toISOString() };
}

export async function dailySummary(day?: string) {
  const { from, to, day: iso } = lagosDayRange(day);
  const byMethod = await q(
    `select o.channel, coalesce(o.payment_method, 'paystack') as method, count(*)::int as orders, coalesce(sum(o.amount_paid),0)::int as amount
     from orders o where o.paid_at >= $1 and o.paid_at < $2 and o.payment_status in ('paid','deposit_paid')
     group by 1, 2`,
    [from, to],
  );
  const balances = await q(
    `select coalesce(sum(p.amount),0)::int as amount, count(*)::int as n from payments p
     where p.kind = 'balance' and p.status = 'success' and p.created_at >= $1 and p.created_at < $2`,
    [from, to],
  );
  const items = await q(
    `select coalesce(sum(oi.qty),0)::int as n from order_items oi join orders o on o.id = oi.order_id
     where o.paid_at >= $1 and o.paid_at < $2 and o.payment_status in ('paid','deposit_paid')`,
    [from, to],
  );
  const split = {
    counterCash: 0,
    counterTransfer: 0,
    counterCard: 0,
    online: 0,
  };
  let orders = 0;
  for (const r of byMethod) {
    orders += r.orders;
    if (r.method === 'paystack') split.online += r.amount;
    else if (r.method === 'cash') split.counterCash += r.amount;
    else if (r.method === 'transfer') split.counterTransfer += r.amount;
    else if (r.method === 'pos_card') split.counterCard += r.amount;
  }
  const total = split.counterCash + split.counterTransfer + split.counterCard + split.online;
  return { day: iso, total, orders, itemsSold: items[0].n, split, balancesCollected: balances[0].amount };
}

export async function salesByDay(days = 14) {
  const rows = await q(
    `select to_char((o.paid_at at time zone 'Africa/Lagos')::date, 'YYYY-MM-DD') as day,
       coalesce(sum(case when o.payment_method = 'paystack' then o.amount_paid else 0 end),0)::int as online,
       coalesce(sum(case when o.payment_method <> 'paystack' then o.amount_paid else 0 end),0)::int as store
     from orders o
     where o.paid_at >= now() - make_interval(days => $1::int) and o.payment_status in ('paid','deposit_paid')
     group by 1 order by 1`,
    [days],
  );
  return rows as { day: string; online: number; store: number }[];
}

export async function topProducts(days = 30, limit = 5) {
  return q(
    `select oi.name, sum(oi.qty)::int as qty, sum(oi.qty * oi.price)::int as revenue from order_items oi join orders o on o.id = oi.order_id
     where o.paid_at >= now() - make_interval(days => $1::int) and o.payment_status in ('paid','deposit_paid')
     group by oi.name order by revenue desc limit $2`,
    [days, limit],
  );
}

export async function salesExport(from: string, to: string) {
  return q(
    `select o.number, to_char(o.paid_at at time zone 'Africa/Lagos', 'YYYY-MM-DD HH24:MI') as paid_at, o.channel,
       coalesce(o.payment_method,'') as payment_method, o.payment_status, o.status, o.customer_name, o.email, o.phone,
       o.subtotal, o.delivery_fee, o.discount, o.total, o.amount_paid, coalesce(s.name,'') as staff
     from orders o left join staff s on s.id = o.staff_id
     where o.paid_at >= $1::timestamptz and o.paid_at < $2::timestamptz order by o.paid_at`,
    [from, to],
  );
}

/* ------------------------------------------------------------------ staff */

export type StaffRow = { id: string; name: string; email: string; role: Role; active: boolean; created_at: string };

export async function findStaffByEmail(email: string) {
  const row = await one(`select * from staff where email = $1`, [email.trim().toLowerCase()]);
  return row ? ser<StaffRow & { password_hash: string }>(row) : null;
}

export async function getStaff(id: string) {
  const row = await one(`select id, name, email, role, active, created_at from staff where id = $1`, [id]);
  return row ? ser<StaffRow>(row) : null;
}

export async function listStaff() {
  const rows = await q(`select id, name, email, role, active, created_at from staff order by role, name`);
  return rows.map((r) => ser<StaffRow>(r));
}

export async function createStaff(s: { name: string; email: string; role: Role; passwordHash: string }) {
  await q(`insert into staff (name, email, role, password_hash) values ($1,$2,$3,$4)`, [s.name, s.email.trim().toLowerCase(), s.role, s.passwordHash]);
}

export async function updateStaff(id: string, s: { role?: Role; active?: boolean; passwordHash?: string; name?: string }) {
  await q(
    `update staff set role = coalesce($2, role), active = coalesce($3, active), password_hash = coalesce($4, password_hash), name = coalesce($5, name) where id = $1`,
    [id, s.role ?? null, s.active ?? null, s.passwordHash ?? null, s.name ?? null],
  );
}

/* -------------------------------------------------------------- customers */

export async function findCustomerByEmail(email: string) {
  const row = await one(`select * from customers where email = $1`, [email.trim().toLowerCase()]);
  return row ? ser<{ id: string; email: string; name: string; phone: string; password_hash: string | null }>(row) : null;
}

export async function getCustomer(id: string) {
  const row = await one(`select id, email, name, phone, created_at from customers where id = $1`, [id]);
  return row ? ser<{ id: string; email: string; name: string; phone: string; created_at: string }>(row) : null;
}

export async function registerCustomer(c: { email: string; name: string; phone: string; passwordHash: string }) {
  const email = c.email.trim().toLowerCase();
  const existing = await findCustomerByEmail(email);
  if (existing?.password_hash) throw new Error('An account with this email already exists. Sign in instead.');
  const [row] = await q(
    `insert into customers (email, name, phone, password_hash) values ($1,$2,$3,$4)
     on conflict (email) do update set name = excluded.name, phone = excluded.phone, password_hash = excluded.password_hash returning id`,
    [email, c.name, c.phone, c.passwordHash],
  );
  return row.id as string;
}

export async function setCustomerPassword(id: string, passwordHash: string) {
  await q(`update customers set password_hash = $2 where id = $1`, [id, passwordHash]);
}

export async function updateCustomer(id: string, c: { name: string; phone: string }) {
  await q(`update customers set name = $2, phone = $3 where id = $1`, [id, c.name, c.phone]);
}

export async function listCustomers(search?: string) {
  const rows = await q(
    `select c.id, c.name, c.email, c.phone, c.password_hash is not null as has_account, c.created_at,
       count(o.id) filter (where o.payment_status in ('paid','deposit_paid'))::int as orders,
       coalesce(sum(o.amount_paid) filter (where o.payment_status in ('paid','deposit_paid')),0)::int as spent,
       max(o.created_at) as last_order
     from customers c left join orders o on o.customer_id = c.id
     ${search ? `where c.name ilike $1 or c.email ilike $1 or c.phone ilike $1` : ''}
     group by c.id order by last_order desc nulls last, c.created_at desc`,
    search ? [`%${search}%`] : [],
  );
  return rows.map((r) => ser(r));
}

export async function customerHistory(customerId: string) {
  const rows = await q(`select o.*, s.name as staff_name from orders o left join staff s on s.id = o.staff_id where customer_id = $1 order by created_at desc`, [customerId]);
  return attachItems(rows);
}

/* ------------------------------------------------------------ saved items */

export async function listSaved(customerId: string) {
  const rows = await q(`select product_id from saved_items where customer_id = $1 order by created_at desc`, [customerId]);
  return rows.map((r) => r.product_id as string);
}

export async function setSaved(customerId: string, productId: string, saved: boolean) {
  if (saved) {
    await q(`insert into saved_items (customer_id, product_id) values ($1,$2) on conflict do nothing`, [customerId, productId]);
  } else {
    await q(`delete from saved_items where customer_id = $1 and product_id = $2`, [customerId, productId]);
  }
}

export async function productsByIds(ids: string[]) {
  if (!ids.length) return [];
  const rows = await q(`select ${PRODUCT_COLUMNS} from products p where p.id = any(string_to_array($1, ',')::uuid[]) and p.published`, [ids.join(',')]);
  const list = await attachVariants(rows);
  return ids.map((id) => list.find((p) => p.id === id)).filter(Boolean) as Product[];
}

/* --------------------------------------------------------------- viewings */

export async function createViewing(v: { productId: string; name: string; email: string; phone: string; preferredAt: string; note: string }) {
  const product = await one(`select name from products where id = $1`, [v.productId]);
  await q(
    `insert into viewings (product_id, product_name, name, email, phone, preferred_at, note) values ($1,$2,$3,$4,$5,$6::timestamptz,$7)`,
    [v.productId, product?.name ?? '', v.name, v.email, v.phone, v.preferredAt, v.note],
  );
  return product?.name as string | undefined;
}

export async function listViewings() {
  const rows = await q(`select * from viewings order by case status when 'requested' then 0 when 'confirmed' then 1 else 2 end, preferred_at`);
  return rows.map((r) => ser(r));
}

export async function setViewingStatus(id: string, status: string) {
  await q(`update viewings set status = $2 where id = $1`, [id, status]);
}

export async function dashboardCounts() {
  const [r] = await q(
    `select
      (select count(*)::int from orders where channel = 'online' and status = 'received') as new_orders,
      (select count(*)::int from orders where status in ('preparing','sent')) as in_progress,
      (select count(*)::int from orders where channel = 'showroom' and status = 'awaiting_payment') as held,
      (select count(*)::int from viewings where status = 'requested') as viewings,
      (select count(*)::int from orders where payment_status = 'deposit_paid' and status <> 'cancelled') as balances_due`,
  );
  return r as { new_orders: number; in_progress: number; held: number; viewings: number; balances_due: number };
}
