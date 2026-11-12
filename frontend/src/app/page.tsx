"use client";

import { useState } from "react";
import { Brain, Github, Zap } from "lucide-react";
import { DocumentManager } from "@/components/DocumentManager";
import { ChatInterface } from "@/components/ChatInterface";
import { cn } from "@/lib/utils";
import type { UploadedDocument } from "@/types";

export default function HomePage() {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);

  const handleDocumentAdded = (doc: UploadedDocument) => {
    setDocuments((prev) => {
      const idx = prev.findIndex((d) => d.document_id === doc.document_id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = doc;
        return updated;
      }
      return [doc, ...prev];
    });
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-950">
      <header className="flex-shrink-0 h-14 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md z-20">
        <div className="flex items-center justify-between h-full px-6 max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-brand-800/60 border border-brand-700/40">
              <Brain className="h-5 w-5 text-brand-300" aria-hidden="true" />
            </div>
            <div>
              <span className="text-sm font-bold text-slate-100 tracking-tight">Hannes</span>
              <span className="text-sm font-bold text-brand-400 tracking-tight"> AI</span>
            </div>
            <span
              className={cn(
                "hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                "bg-brand-900/50 text-brand-400 border border-brand-800/50"
              )}
            >
              <Zap className="h-2.5 w-2.5" aria-hidden="true" />
              Hybrid RAG
            </span>
          </div>

          <div className="flex items-center gap-3">
            <StatusPill
              label={`${documents.length} ${documents.length === 1 ? "Dokument" : "Dokumente"}`}
              active={documents.length > 0}
            />
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              aria-label="GitHub Repository"
            >
              <Github className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden max-w-screen-2xl mx-auto w-full">
        <aside
          className="w-80 xl:w-96 flex-shrink-0 flex flex-col border-r border-slate-800/70 bg-slate-950 overflow-hidden"
          aria-label="Dokumenten-Manager"
        >
          <div className="flex-1 overflow-y-auto p-5">
            <DocumentManager
              documents={documents}
              onDocumentAdded={handleDocumentAdded}
            />
          </div>
        </aside>

        <section
          className="flex-1 flex flex-col overflow-hidden bg-slate-950/60 relative"
          aria-label="Chat Interface"
        >
          <div
            className="absolute inset-0 opacity-[0.015] pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgb(148 163 184) 1px, transparent 0)",
              backgroundSize: "32px 32px",
            }}
            aria-hidden="true"
          />

          <div className="relative flex-1 flex flex-col overflow-hidden p-5">
            <ChatInterface />
          </div>
        </section>
      </main>
    </div>
  );
}

function StatusPill({ label, active }: { label: string; active: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-300",
        active
          ? "bg-emerald-950/50 text-emerald-400 border-emerald-800/50"
          : "bg-slate-800/50 text-slate-500 border-slate-700/50"
      )}
      aria-live="polite"
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          active ? "bg-emerald-400 animate-pulse" : "bg-slate-600"
        )}
        aria-hidden="true"
      />
      {label}
    </div>
  );
}
