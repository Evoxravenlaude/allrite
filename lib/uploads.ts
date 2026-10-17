import 'server-only';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { DATA_DIR } from './paths';

const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
export const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');

/**
 * With Supabase configured, photos go to the public "products" storage bucket.
 * Without it (local demo), they are kept in .data/uploads and served from /uploads/.
 */
export async function saveUpload(file: File): Promise<string> {
  const name = `${Date.now().toString(36)}-${crypto.randomBytes(5).toString('hex')}.${EXT[file.type] ?? 'jpg'}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { error } = await supabase.storage.from('products').upload(name, bytes, { contentType: file.type, cacheControl: '31536000' });
    if (error) throw error;
    return supabase.storage.from('products').getPublicUrl(name).data.publicUrl;
  }
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, name), bytes);
  return `/uploads/${name}`;
}
