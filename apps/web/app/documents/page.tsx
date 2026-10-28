import { AppHeader } from '@/components/app/AppHeader';
import { DocumentLibrary } from '@/components/documents/DocumentLibrary';
import { requireUser } from '@/lib/auth/session';
import { listDocuments } from '@/lib/db/queries';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'My documents',
  description: 'Keep case files, drafts and reference documents with your LegalBuddy research.',
};

export default async function DocumentsPage() {
  const user = await requireUser('/documents');
  const documents = await listDocuments(user.id);

  return (
    <div className="min-h-dvh bg-bg text-text">
      <AppHeader active="documents" />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-accent">
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

        <DocumentLibrary initialDocuments={documents} />
      </main>
    </div>
  );
}
