import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth/session';
import { deleteDocumentRecord } from '@/lib/db/queries';
import { deleteObject, isStorageConfigured } from '@/lib/storage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Please sign in to manage documents.' }, { status: 401 });
  }

  const { documentId } = await params;
  const document = await deleteDocumentRecord(user.id, documentId);
  if (!document) {
    return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
  }

  if (isStorageConfigured()) {
    try {
      await deleteObject(document.storageKey);
    } catch (error) {
      // The database row is already gone, so the user no longer sees the file.
      // Log the orphaned object for cleanup instead of failing the request.
      console.error('Document object delete failed', document.storageKey, error);
    }
  }

  return NextResponse.json({ deleted: true });
}
