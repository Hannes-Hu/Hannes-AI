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
        setErrorMsg("Only PDF documents are supported.");
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
        setErrorMsg(err instanceof Error ? err.message : "Upload processing failed.");
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
        <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          <FileText className="h-4 w-4 text-brand-400" aria-hidden="true" />
          Dokumente
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
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
          "transition-all duration-200 select-none",
          isDragging
            ? "border-brand-500 bg-brand-900/30 scale-[1.01]"
            : "border-slate-700 hover:border-slate-600 hover:bg-slate-800/30",
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
            <Spinner size="lg" className="text-brand-400" />
            <p className="text-sm font-medium text-brand-300">Indexiere Chunks…</p>
          </>
        ) : status === "success" ? (
          <>
            <CheckCircle2 className="h-9 w-9 text-emerald-400" aria-hidden="true" />
            <p className="text-sm font-medium text-emerald-300">Erfolgreich indexiert</p>
          </>
        ) : (
          <>
            <UploadCloud
              className={cn(
                "h-9 w-9 transition-colors",
                isDragging ? "text-brand-400" : "text-slate-500"
              )}
              aria-hidden="true"
            />
            <div className="text-center">
              <p className="text-sm font-medium text-slate-300">
                PDF hier ablegen
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                oder klicken zum Auswählen (max. 50 MB)
              </p>
            </div>
          </>
        )}
      </div>

      {status === "error" && errorMsg && (
        <div
          role="alert"
          className="flex items-start gap-2.5 p-3 rounded-lg text-sm animate-fade-in bg-red-950/50 border border-red-800/50 text-red-300"
        >
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <span className="flex-1">{errorMsg}</span>
          <button
            onClick={() => {
              setStatus("idle");
              setErrorMsg(null);
            }}
            className="flex-shrink-0 text-red-400 hover:text-red-200"
            aria-label="Fehlermeldung schließen"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
        {documents.length === 0 ? (
          <p className="text-xs text-slate-600 text-center py-8">
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
    <div className="flex items-start gap-3 p-3 rounded-xl animate-fade-in bg-slate-800/50 border border-slate-700/50 hover:border-slate-600/70 transition-colors">
      <div className="flex-shrink-0 p-2 rounded-lg bg-brand-900/50 border border-brand-800/40 mt-0.5" aria-hidden="true">
        <FileText className="h-4 w-4 text-brand-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-200 truncate" title={doc.filename}>
          {truncateFilename(doc.filename)}
        </p>
        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
          <span>{doc.total_pages} {doc.total_pages === 1 ? "Seite" : "Seiten"}</span>
          <span aria-hidden="true">·</span>
          <span>{doc.total_chunks} Chunks</span>
        </div>
        <div className="flex items-center gap-1.5 mt-1.5">
          <CheckCircle2 className="h-3 w-3 text-emerald-500" aria-hidden="true" />
          <span className="text-xs text-emerald-500 font-medium">Bereit</span>
        </div>
      </div>
    </div>
  );
}
