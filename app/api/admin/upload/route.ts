import { NextResponse } from 'next/server';
import { saveUpload } from '@/lib/uploads';
import { assertStaff } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    await assertStaff('edit_products');
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 401 });
  }
  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Choose a photo to upload.' }, { status: 400 });
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return NextResponse.json({ error: 'Upload a JPG, PNG or WebP photo.' }, { status: 400 });
  if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: 'Photos must be smaller than 8 MB.' }, { status: 400 });
  try {
    return NextResponse.json({ url: await saveUpload(file) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'The photo could not be saved. Try again.' }, { status: 500 });
  }
}
