'use client';

import { useRef, useState } from 'react';
import {
  Download,
  FileArchive,
  FileImage,
  FileText,
  Loader2,
  LockKeyhole,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import type { StoredDocument } from '@/lib/db/queries';
import { cn } from '@/lib/utils';

const ACCEPT = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/png',
  'image/jpeg',
  'image/webp',
].join(',');

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return FileImage;
  if (mimeType.includes('pdf') || mimeType.startsWith('text/')) return FileText;
  return FileArchive;
}

export function DocumentLibrary({ initialDocuments }: { initialDocuments: StoredDocument[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState(initialDocuments);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function uploadFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;

    setError('');
    setUploading(true);

    for (const file of list) {
      const form = new FormData();
      form.append('file', file);

      try {
        const response = await fetch('/api/documents', { method: 'POST', body: form });
        const payload = await response.json().catch(() => null);
        if (!response.ok) {
          setError(payload?.error ?? `Could not upload ${file.name}.`);
          continue;
        }
        setDocuments((current) => [payload.document as StoredDocument, ...current]);
      } catch {
        setError(`Could not upload ${file.name}. Check your connection and try again.`);
      }
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function remove(document: StoredDocument) {
    if (!window.confirm(`Delete “${document.name}”? This cannot be undone.`)) return;
    setError('');
    setDeletingId(document.id);

    try {
      const response = await fetch(`/api/documents/${document.id}`, { method: 'DELETE' });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        setError(payload?.error ?? 'The document could not be deleted.');
        return;
      }
      setDocuments((current) => current.filter((item) => item.id !== document.id));
    } catch {
      setError('The document could not be deleted. Check your connection and try again.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (!uploading) void uploadFiles(event.dataTransfer.files);
        }}
        className={cn(
          'rounded-3xl border-2 border-dashed p-8 text-center transition-colors sm:p-10',
          dragging
            ? 'border-accent bg-accent-soft/70'
            : 'border-line bg-surface hover:border-accent/35',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(event) => {
            if (event.target.files) void uploadFiles(event.target.files);
          }}
        />

        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent-strong text-white shadow-lg">
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : (
            <UploadCloud className="h-6 w-6" />
          )}
        </span>
        <h2 className="mt-4 text-lg font-semibold tracking-tight text-text">
          {uploading ? 'Uploading…' : 'Add a document'}
        </h2>
        <p className="mx-auto mt-1 max-w-md text-[14px] leading-relaxed text-muted">
          Drop files here or choose them from your device. PDF, Word, text and
          image files up to 15 MB each.
        </p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="btn-shine mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#1d8a66] to-[#0e5a42] px-5 text-sm font-bold text-white shadow-[0_10px_26px_-10px_rgba(20,113,83,0.6)] transition-all hover:-translate-y-px hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
          {uploading ? 'Uploading…' : 'Choose files'}
        </button>

        <p className="mt-4 inline-flex items-center gap-1.5 text-[12px] text-faint">
          <LockKeyhole className="h-3.5 w-3.5" />
          Files are private to your account and stored in Neon Object Storage.
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-2xl border border-danger/25 bg-danger/5 px-4 py-3 text-[14px] text-danger">
          {error}
        </div>
      )}

      <div>
        <div className="mb-3 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-text">Your documents</h2>
            <p className="text-[13px] text-muted">
              {documents.length === 0
                ? 'Nothing saved yet.'
                : `${documents.length} file${documents.length === 1 ? '' : 's'} saved.`}
            </p>
          </div>
        </div>

        {documents.length === 0 ? (
          <div className="rounded-3xl border border-line bg-surface px-6 py-12 text-center">
            <FileText className="mx-auto h-8 w-8 text-faint" />
            <p className="mt-3 text-sm font-semibold text-text">Your library is empty</p>
            <p className="mx-auto mt-1 max-w-sm text-[13.5px] leading-relaxed text-muted">
              Keep case files, drafts and reference documents together with your
              research. You can download them at any time.
            </p>
          </div>
        ) : (
          <ul className="overflow-hidden rounded-3xl border border-line bg-surface">
            {documents.map((document, index) => {
              const Icon = fileIcon(document.mime_type);
              return (
                <li
                  key={document.id}
                  className={cn(
                    'flex items-center gap-3.5 px-4 py-4 sm:px-5',
                    index > 0 && 'border-t border-line',
                  )}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-strong">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14.5px] font-semibold text-text">{document.name}</p>
                    <p className="mt-0.5 text-[12px] text-faint">
                      {formatBytes(document.size_bytes)}
                      {' · '}
                      {new Date(document.created_at).toLocaleDateString(undefined, {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <a
                    href={`/api/documents/${document.id}/download`}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-line text-muted transition-colors hover:border-accent/40 hover:bg-accent-soft hover:text-accent-strong"
                    aria-label={`Download ${document.name}`}
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => remove(document)}
                    disabled={deletingId === document.id}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-line text-muted transition-colors hover:border-danger/30 hover:bg-danger/5 hover:text-danger disabled:opacity-60"
                    aria-label={`Delete ${document.name}`}
                    title="Delete"
                  >
                    {deletingId === document.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
