"use client";

import { useEffect, useRef } from "react";
import { ArrowUp, Check, FileText, Loader2, Paperclip, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ChatAttachment {
  id: string;
  name: string;
}

const ACCEPT = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "image/png",
  "image/jpeg",
  "image/webp",
].join(",");

export function Composer({
  value,
  onChange,
  onSend,
  loading,
  attachments,
  uploading,
  uploadError,
  onUpload,
  onRemoveAttachment,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  loading: boolean;
  attachments: ChatAttachment[];
  uploading: boolean;
  uploadError: string;
  onUpload: (files: FileList | File[]) => void;
  onRemoveAttachment: (id: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Auto-grow the textarea up to a cap.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  const canSend = value.trim().length > 0 && !loading && !uploading;

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) onSend();
    }
  }

  return (
    <div>
      {(attachments.length > 0 || uploading || uploadError) && (
        <div className="mb-2 space-y-1.5">
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {attachments.map((attachment) => (
                <span
                  key={attachment.id}
                  className="inline-flex max-w-[260px] items-center gap-1.5 rounded-md border border-line bg-surface px-2 py-1 text-[11px] text-muted"
                >
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{attachment.name}</span>
                  <span className="inline-flex shrink-0 items-center gap-0.5 text-accent">
                    <Check className="h-3 w-3" />
                    Saved
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveAttachment(attachment.id)}
                    aria-label={`Remove ${attachment.name}`}
                    className="ml-0.5 rounded p-0.5 text-faint transition-colors hover:bg-surface-2 hover:text-text"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          {uploading && (
            <p className="flex items-center gap-1.5 text-[11px] text-muted">
              <Loader2 className="h-3 w-3 animate-spin" />
              Uploading to your documents…
            </p>
          )}
          {uploadError && (
            <p role="alert" className="text-[11px] text-danger">
              {uploadError}
            </p>
          )}
        </div>
      )}

      <div className="flex items-end gap-1 rounded-xl border border-line bg-surface p-1.5 focus-within:border-accent/50 focus-within:ring-2 focus-within:ring-accent/10">
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(event) => {
            if (event.target.files?.length) onUpload(event.target.files);
            event.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          aria-label="Upload a document"
          title="Upload a document"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-text disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Paperclip className="h-4 w-4" />
          )}
        </button>

        <label htmlFor="composer" className="sr-only">
          Ask a legal question
        </label>
        <textarea
          id="composer"
          ref={ref}
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about theft, bail, writs, evidence…"
          className="block max-h-[200px] flex-1 resize-none bg-transparent px-1 py-2 text-[15px] leading-relaxed text-text outline-none placeholder:text-faint"
        />

        <span className="mb-3 hidden text-[10px] text-faint lg:block">
          ⏎ send · ⇧⏎ newline
        </span>

        <button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          aria-label="Send"
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
            canSend
              ? "bg-text text-bg hover:opacity-85"
              : "cursor-not-allowed bg-surface-2 text-faint",
          )}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowUp className="h-4 w-4" strokeWidth={2.25} />
          )}
        </button>
      </div>
    </div>
  );
}
