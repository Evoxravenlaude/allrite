import { assertStaff } from '@/lib/auth';
import { allStock, lagosDayRange, listCustomers, salesExport } from '@/lib/store';

export const dynamic = 'force-dynamic';

function csv(rows: Record<string, unknown>[]) {
  if (!rows.length) return 'No rows\n';
  const cols = Object.keys(rows[0]);
  const cell = (v: unknown) => {
    const s = v instanceof Date ? v.toISOString() : v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return '﻿' + [cols.join(','), ...rows.map((r) => cols.map((c) => cell(r[c])).join(','))].join('\n') + '\n';
}

export async function GET(req: Request, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  const url = new URL(req.url);
  let rows: Record<string, unknown>[];
  let name: string;
  try {
    if (kind === 'sales') {
      await assertStaff('view_reports');
      const from = lagosDayRange(url.searchParams.get('from') ?? undefined);
      const to = lagosDayRange(url.searchParams.get('to') ?? undefined);
      rows = await salesExport(from.from, to.to);
      name = `allrite-sales-${from.day}-to-${to.day}.csv`;
    } else if (kind === 'stock') {
      await assertStaff('edit_stock');
      rows = (await allStock()).map((r: Record<string, unknown>) => ({
        product: r.name, department: r.department, category: r.category, size: r.size, colour: r.colour,
        barcode: r.barcode, price: r.price, stock: r.stock, low_stock_level: r.low_stock_at,
      }));
      name = `allrite-stock-${lagosDayRange().day}.csv`;
    } else if (kind === 'customers') {
      await assertStaff('view_customers');
      rows = (await listCustomers()).map((r: Record<string, unknown>) => ({
        name: r.name, email: r.email, phone: r.phone, has_account: r.has_account, paid_orders: r.orders, total_spent: r.spent, last_order: r.last_order,
      }));
      name = `allrite-customers-${lagosDayRange().day}.csv`;
    } else {
      return new Response('Unknown export', { status: 404 });
    }
  } catch (err) {
    return new Response((err as Error).message, { status: 403 });
  }
  return new Response(csv(rows), {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${name}"` },
  });
}
