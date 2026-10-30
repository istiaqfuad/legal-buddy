import { AppHeader } from '@/components/app/AppHeader';
import { DocumentLibrary } from '@/components/documents/DocumentLibrary';
import { requireUser } from '@/lib/auth/session';
import { listDocuments, type StoredDocument } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'My documents',
  description: 'Keep case files, drafts and reference documents with your LegalBuddy research.',
};

export default async function DocumentsPage() {
  const user = await requireUser('/documents');

  let documents: StoredDocument[] = [];
  let libraryUnavailable = false;
  try {
    documents = await listDocuments(user.id);
  } catch (error) {
    console.error('Could not load document library', error);
    libraryUnavailable = true;
  }

  return (
    <div className="min-h-dvh bg-bg text-text">
      <AppHeader active="documents" />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
            Document library
          </p>
          <h1 className="font-display mt-2 text-balance text-3xl font-semibold tracking-tight text-text sm:text-4xl">
            Keep your files with your research
          </h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted">
            Store case files, drafts and reference documents in your private
            library. Files stay attached to your account and can be downloaded
            whenever you need them.
          </p>
        </div>

        {libraryUnavailable ? (
          <div className="rounded-2xl border border-line bg-surface px-5 py-6 sm:px-6">
            <h2 className="text-[15px] font-semibold text-text">
              Your document library is temporarily unavailable
            </h2>
            <p className="mt-1 max-w-xl text-[14px] leading-relaxed text-muted">
              We couldn&rsquo;t load your saved files. Your uploads are safe.
              Reload the page in a moment, or try again shortly.
            </p>
            <a
              href="/documents"
              className="mt-4 inline-flex h-9 items-center rounded-lg border border-line px-3.5 text-[13px] font-semibold text-text transition-colors hover:bg-surface-2"
            >
              Reload
            </a>
          </div>
        ) : (
          <DocumentLibrary initialDocuments={documents} />
        )}
      </main>
    </div>
  );
}
