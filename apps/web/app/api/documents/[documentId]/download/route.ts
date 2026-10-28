import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { findDocument } from '@/lib/db/queries';
import { createDownloadUrl, isStorageConfigured } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Please sign in to download documents.' }, { status: 401 });
  }

  if (!isStorageConfigured()) {
    return NextResponse.json(
      { error: 'Document storage is not configured on this server.' },
      { status: 503 },
    );
  }

  const { documentId } = await params;
  const document = await findDocument(user.id, documentId);
  if (!document) {
    return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
  }

  const url = await createDownloadUrl(document.storageKey, document.name);
  return NextResponse.redirect(url, {
    status: 307,
    headers: { 'Cache-Control': 'no-store' },
  });
}
