"use client";

import {
  useCallback,
  useRef,
  useState,
  type DragEvent,
  type ChangeEvent,
} from "react";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X } from "lucide-react";
import { Spinner } from "@/components/ui/Button";
import { uploadDocument } from "@/lib/api";
import { cn, truncateFilename } from "@/lib/utils";
import type { UploadStatus, UploadedDocument } from "@/types";

interface DocumentManagerProps {
  documents: UploadedDocument[];
  onDocumentAdded: (doc: UploadedDocument) => void;
}

export function DocumentManager({ documents, onDocumentAdded }: DocumentManagerProps) {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        setErrorMsg("Nur PDF-Dokumente werden unterstützt.");
        setStatus("error");
        return;
      }

      setStatus("uploading");
      setErrorMsg(null);

      try {
        const response = await uploadDocument(file);
        onDocumentAdded({
          ...response.document,
          uploadedAt: new Date(),
          status: "ready",
        });
        setStatus("success");
        setTimeout(() => setStatus("idle"), 3000);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Upload fehlgeschlagen.");
        setStatus("error");
      }
    },
    [onDocumentAdded]
  );

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void processFile(file);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void processFile(file);
    e.target.value = "";
  };

  return (
    <aside className="flex flex-col gap-5 h-full">
      <div>
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <FileText className="h-4 w-4 text-zinc-700 dark:text-zinc-300" aria-hidden="true" />
          Dokumente
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          PDFs hochladen und durchsuchen
        </p>
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-label="PDF hochladen"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
        }}
        className={cn(
          "relative flex flex-col items-center justify-center gap-3",
          "rounded-xl border-2 border-dashed p-6 cursor-pointer",
          "transition-all duration-150 select-none",
          isDragging
            ? "border-zinc-500 bg-zinc-100 dark:bg-zinc-900 scale-[1.01]"
            : "border-zinc-300 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-700 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/40",
          status === "uploading" && "pointer-events-none opacity-70"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileChange}
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
        />

        {status === "uploading" ? (
          <>
            <Spinner size="lg" className="text-zinc-700 dark:text-zinc-300" />
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Indexiere Chunks…</p>
          </>
        ) : status === "success" ? (
          <>
            <CheckCircle2 className="h-9 w-9 text-emerald-500 dark:text-emerald-400" aria-hidden="true" />
            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-300">Erfolgreich indexiert</p>
          </>
        ) : (
          <>
            <UploadCloud
              className={cn(
                "h-9 w-9 transition-colors",
                isDragging ? "text-zinc-700 dark:text-zinc-200" : "text-zinc-400 dark:text-zinc-500"
              )}
              aria-hidden="true"
            />
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                PDF hier ablegen
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                oder klicken zum Auswählen (max. 50 MB)
              </p>
            </div>
          </>
        )}
      </div>

      {status === "error" && errorMsg && (
        <div
          role="alert"
          className="flex items-start gap-2.5 p-3 rounded-lg text-sm animate-fade-in bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300"
        >
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-red-500" aria-hidden="true" />
          <span className="flex-1">{errorMsg}</span>
          <button
            onClick={() => {
              setStatus("idle");
              setErrorMsg(null);
            }}
            className="flex-shrink-0 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200"
            aria-label="Fehlermeldung schließen"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
        {documents.length === 0 ? (
          <p className="text-xs text-zinc-400 dark:text-zinc-600 text-center py-8">
            Noch keine Dokumente indexiert.
          </p>
        ) : (
          documents.map((doc) => <DocumentCard key={doc.document_id} document={doc} />)
        )}
      </div>
    </aside>
  );
}

function DocumentCard({ document: doc }: { document: UploadedDocument }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl animate-fade-in bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors shadow-sm dark:shadow-none">
      <div className="flex-shrink-0 p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 mt-0.5" aria-hidden="true">
        <FileText className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate" title={doc.filename}>
          {truncateFilename(doc.filename)}
        </p>
        <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          <span>{doc.total_pages} {doc.total_pages === 1 ? "Seite" : "Seiten"}</span>
          <span aria-hidden="true">·</span>
          <span>{doc.total_chunks} Chunks</span>
        </div>
        <div className="flex items-center gap-1.5 mt-1.5">
          <CheckCircle2 className="h-3 w-3 text-emerald-500" aria-hidden="true" />
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Bereit</span>
        </div>
      </div>
    </div>
  );
}
