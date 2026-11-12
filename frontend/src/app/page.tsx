"use client";

import { useState } from "react";
import { Brain, Github, Zap } from "lucide-react";
import { DocumentManager } from "@/components/DocumentManager";
import { ChatInterface } from "@/components/ChatInterface";
import { SessionSidebar } from "@/components/SessionSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import type { UploadedDocument } from "@/types";

export default function HomePage() {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessionsRevision, setSessionsRevision] = useState(0);

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
    <div className="flex flex-col h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-150">
      <header className="flex-shrink-0 h-14 border-b border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md z-20 transition-colors duration-150">
        <div className="flex items-center justify-between h-full px-6 max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <Brain className="h-5 w-5 text-zinc-800 dark:text-zinc-200" aria-hidden="true" />
            </div>
            <div>
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Hannes</span>
              <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400 tracking-tight"> AI</span>
            </div>
            <span
              className={cn(
                "hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium",
                "bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800"
              )}
            >
              <Zap className="h-2.5 w-2.5" aria-hidden="true" />
              Hybrid RAG
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <StatusPill
              label={`${documents.length} ${documents.length === 1 ? "Dokument" : "Dokumente"}`}
              active={documents.length > 0}
            />

            <ThemeToggle />

            <a
              href="https://github.com/Hannes-Hu/Hannes-AI"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
              aria-label="GitHub Repository"
            >
              <Github className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden max-w-screen-2xl mx-auto w-full">
        <div className="w-56 xl:w-64 flex-shrink-0 overflow-hidden">
          <SessionSidebar
            activeSessionId={activeSessionId}
            onSessionSelect={setActiveSessionId}
            onNewSession={() => setActiveSessionId(null)}
            revision={sessionsRevision}
          />
        </div>

        <aside
          className="w-72 xl:w-80 flex-shrink-0 flex flex-col border-r border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950 overflow-hidden transition-colors duration-150"
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
          className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-zinc-950 relative transition-colors duration-150"
          aria-label="Chat Interface"
        >
          <div className="relative flex-1 flex flex-col overflow-hidden p-5">
            <ChatInterface
              sessionId={activeSessionId}
              onSessionCreated={setActiveSessionId}
              onStreamComplete={() => setSessionsRevision((r) => r + 1)}
            />
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
        "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-200",
        active
          ? "bg-zinc-100 text-zinc-900 border-zinc-300 dark:bg-zinc-900 dark:text-zinc-200 dark:border-zinc-700"
          : "bg-zinc-100/70 text-zinc-500 border-zinc-200 dark:bg-zinc-900/60 dark:text-zinc-500 dark:border-zinc-800"
      )}
      aria-live="polite"
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          active ? "bg-emerald-500 animate-pulse" : "bg-zinc-400 dark:bg-zinc-600"
        )}
        aria-hidden="true"
      />
      {label}
    </div>
  );
}
