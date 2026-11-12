"use client";

import { useEffect, useCallback } from "react";
import type { Source } from "@/types";
import { X, FileText, BookOpen, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

interface SourceModalProps {
  source: Source | null;
  onClose: () => void;
}

export function SourceModal({ source, onClose }: SourceModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!source) return;
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [source, handleKeyDown]);

  if (!source) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="source-modal-title"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={cn(
          "relative z-10 w-full max-w-2xl rounded-2xl animate-slide-up",
          "bg-slate-900 border border-slate-700/80 shadow-2xl shadow-black/60"
        )}
      >
        <div className="flex items-start justify-between gap-4 p-5 border-b border-slate-700/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 p-2 rounded-lg bg-brand-900/50 border border-brand-700/40">
              <FileText className="h-5 w-5 text-brand-400" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2
                id="source-modal-title"
                className="text-sm font-semibold text-slate-100 truncate"
              >
                {source.filename}
              </h2>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <BookOpen className="h-3 w-3" aria-hidden="true" />
                  Seite {source.page_number}
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Hash className="h-3 w-3" aria-hidden="true" />
                  Chunk {source.chunk_index}
                </span>
                {source.relevance_score > 0 && (
                  <span className="text-xs text-brand-400 font-medium">
                    {Math.round(source.relevance_score * 100)}% Match
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            aria-label="Modal schließen"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
            Original-Textauszug
          </p>
          <blockquote
            className={cn(
              "relative pl-4 text-sm text-slate-300 leading-relaxed",
              "border-l-2 border-brand-600/70 font-mono bg-slate-800/40 rounded-r-lg p-4"
            )}
          >
            {source.snippet}
          </blockquote>
        </div>

        <div className="px-5 pb-5">
          <p className="text-xs text-slate-600">
            Drücke <kbd className="px-1.5 py-0.5 text-xs font-mono bg-slate-800 border border-slate-700 rounded text-slate-400">ESC</kbd> zum Schließen.
          </p>
        </div>
      </div>
    </div>
  );
}
