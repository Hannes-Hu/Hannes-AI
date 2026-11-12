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
        className="absolute inset-0 bg-black/50 dark:bg-black/75 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={cn(
          "relative z-10 w-full max-w-2xl rounded-2xl animate-slide-up shadow-2xl",
          "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
        )}
      >
        <div className="flex items-start justify-between gap-4 p-5 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex-shrink-0 p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
              <FileText className="h-5 w-5 text-zinc-700 dark:text-zinc-300" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2
                id="source-modal-title"
                className="text-sm font-semibold truncate"
              >
                {source.filename}
              </h2>
              <div className="flex items-center gap-3 mt-0.5">
                <span className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                  <BookOpen className="h-3 w-3" aria-hidden="true" />
                  Seite {source.page_number}
                </span>
                <span className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                  <Hash className="h-3 w-3" aria-hidden="true" />
                  Chunk {source.chunk_index}
                </span>
                {source.relevance_score > 0 && (
                  <span className="text-xs text-zinc-600 dark:text-zinc-300 font-medium">
                    {Math.round(source.relevance_score * 100)}% Match
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
            aria-label="Modal schließen"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5">
          <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">
            Original-Textauszug
          </p>
          <blockquote
            className={cn(
              "relative pl-4 text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed",
              "border-l-2 border-zinc-400 dark:border-zinc-600 font-mono bg-zinc-50 dark:bg-zinc-950/60 rounded-r-lg p-4"
            )}
          >
            {source.snippet}
          </blockquote>
        </div>

        <div className="px-5 pb-5">
          <p className="text-xs text-zinc-400 dark:text-zinc-600">
            Drücke <kbd className="px-1.5 py-0.5 text-xs font-mono bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded text-zinc-600 dark:text-zinc-400">ESC</kbd> zum Schließen.
          </p>
        </div>
      </div>
    </div>
  );
}
