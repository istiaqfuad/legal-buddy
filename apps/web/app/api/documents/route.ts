import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { createDocument, listDocuments } from '@/lib/db/queries';
import {
  ALLOWED_DOCUMENT_TYPES,
  MAX_UPLOAD_BYTES,
  buildStorageKey,
  deleteObject,
  isStorageConfigured,
  uploadObject,
} from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Please sign in to view your documents.' }, { status: 401 });
  }

  const documents = await listDocuments(user.id);
  return NextResponse.json({ documents });
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Please sign in to upload a document.' }, { status: 401 });
  }

  if (!isStorageConfigured()) {
    return NextResponse.json(
      { error: 'Document storage is not configured on this server.' },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: 'The upload could not be read.' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Choose a file to upload.' }, { status: 400 });
  }

  if (file.size === 0) {
    return NextResponse.json({ error: 'The selected file is empty.' }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: 'Files must be 15 MB or smaller.' },
      { status: 413 },
    );
  }

  const mimeType = file.type || 'application/octet-stream';
  if (!(ALLOWED_DOCUMENT_TYPES as readonly string[]).includes(mimeType)) {
    return NextResponse.json(
      { error: 'Upload a PDF, Word document, text file, or a PNG, JPEG or WebP image.' },
      { status: 415 },
    );
  }

  const filename = file.name.slice(0, 200) || 'document';
  const storageKey = buildStorageKey(user.id, filename);

  try {
    await uploadObject({
      key: storageKey,
      body: new Uint8Array(await file.arrayBuffer()),
      contentType: mimeType,
    });
  } catch (error) {
    console.error('Document upload failed', error);
    return NextResponse.json(
      { error: 'The file could not be stored. Please try again.' },
      { status: 502 },
    );
  }

  try {
    const document = await createDocument({
      userId: user.id,
      name: filename,
      mimeType,
      sizeBytes: file.size,
      storageKey,
    });
    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    console.error('Document metadata save failed', error);
    await deleteObject(storageKey).catch(() => undefined);
    return NextResponse.json(
      { error: 'The file was uploaded but could not be added to your library. Please try again.' },
      { status: 500 },
    );
  }
}
