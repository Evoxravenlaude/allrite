import path from 'node:path';

/**
 * Where the demo database and demo photo uploads are kept.
 * On Vercel the project folder is read-only, so they go to /tmp, which is wiped
 * whenever Vercel starts a fresh server. The live site keeps everything in Supabase instead.
 */
export const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'allrite') : path.join(process.cwd(), '.data');

/** The site's public address, for links in emails, the sitemap and social previews. */
export function baseUrl() {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '');
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return 'http://localhost:3000';
}
