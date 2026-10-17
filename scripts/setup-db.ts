/**
 * Prepares the live database (Supabase) once, before launch.
 *   npm run db:setup            creates the tables, the owner account and the delivery areas
 *   npm run db:setup -- --demo  also loads the 26 sample products and demo staff accounts
 * Reads DATABASE_URL, OWNER_NAME, OWNER_EMAIL and OWNER_PASSWORD from .env.local.
 */
import fs from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';
import { seed } from '../lib/seed';

for (const file of ['.env.local', '.env']) {
  const p = path.join(process.cwd(), file);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('Set DATABASE_URL in .env.local first.');
  if (!process.env.OWNER_EMAIL || !process.env.OWNER_PASSWORD) throw new Error('Set OWNER_EMAIL and OWNER_PASSWORD in .env.local first.');
  const sql = postgres(url, { prepare: false, max: 1 });
  const [{ exists }] = await sql`select exists (select 1 from information_schema.tables where table_name = 'products') as exists`;
  if (!exists) {
    await sql.unsafe(fs.readFileSync(path.join(process.cwd(), 'db', 'schema.sql'), 'utf8'));
    console.log('Tables created.');
  } else {
    console.log('Tables already exist. Leaving them as they are.');
  }
  await seed((text, params = []) => sql.unsafe(text, params as never[]) as never, { demoProducts: process.argv.includes('--demo') });
  console.log(`Owner account ready: ${process.env.OWNER_EMAIL}`);
  await sql.end();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
