import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { DATA_DIR } from './paths';

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Row = Record<string, any>;
export type Query = (text: string, params?: unknown[]) => Promise<Row[]>;

type Driver = {
  query: Query;
  tx: <T>(fn: (q: Query) => Promise<T>) => Promise<T>;
  kind: 'postgres' | 'embedded';
};

const g = globalThis as unknown as { __allriteDb?: Promise<Driver> };

/**
 * DATABASE_URL set  -> the live Supabase (PostgreSQL) database.
 * DATABASE_URL unset -> an embedded PostgreSQL stored in .data/ for local demos.
 * Both run the exact same SQL.
 */
async function createDriver(): Promise<Driver> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const { default: postgres } = await import('postgres');
    const sql = postgres(url, { prepare: false, max: Number(process.env.DATABASE_POOL_SIZE) || (process.env.VERCEL ? 1 : 5), idle_timeout: 20 });
    const query: Query = (text, params = []) => sql.unsafe(text, params as any[]) as unknown as Promise<Row[]>;
    return {
      kind: 'postgres',
      query,
      tx: (fn) => sql.begin((t) => fn((text, params = []) => t.unsafe(text, params as any[]) as unknown as Promise<Row[]>)) as any,
    };
  }

  if (process.env.NODE_ENV === 'production' && process.env.DEMO_MODE !== '1') {
    throw new Error('DATABASE_URL is not set. Add the Supabase connection string, or set DEMO_MODE=1 to run the demo database.');
  }
  const { PGlite } = await import('@electric-sql/pglite');
  const dir = path.join(DATA_DIR, 'pg');
  fs.mkdirSync(dir, { recursive: true });
  const db = new PGlite(dir);
  await db.waitReady;
  let chain: Promise<unknown> = Promise.resolve();
  // The embedded database handles one transaction at a time; queue them.
  const serial = <T>(work: () => Promise<T>): Promise<T> => {
    const next = chain.then(work, work);
    chain = next.catch(() => undefined);
    return next;
  };
  const driver: Driver = {
    kind: 'embedded',
    query: (text, params = []) => serial(async () => (await db.query<Row>(text, params as any[])).rows),
    tx: (fn) =>
      serial(() => db.transaction(async (t) => fn(async (text, params = []) => (await t.query<Row>(text, params as any[])).rows))),
  };
  const [{ exists }] = await driver.query(
    `select exists (select 1 from information_schema.tables where table_name = 'products') as exists`,
  );
  if (!exists) {
    const schema = fs.readFileSync(path.join(process.cwd(), 'db', 'schema.sql'), 'utf8');
    await serial(() => db.exec(schema));
    const { seed } = await import('./seed');
    await seed(driver.query);
  }
  return driver;
}

function driver(): Promise<Driver> {
  if (!g.__allriteDb) g.__allriteDb = createDriver();
  return g.__allriteDb;
}

export async function q(text: string, params: unknown[] = []): Promise<Row[]> {
  return (await driver()).query(text, params);
}

export async function one(text: string, params: unknown[] = []): Promise<Row | null> {
  const rows = await q(text, params);
  return rows[0] ?? null;
}

export async function tx<T>(fn: (q: Query) => Promise<T>): Promise<T> {
  return (await driver()).tx(fn);
}

export async function dbKind() {
  return (await driver()).kind;
}
