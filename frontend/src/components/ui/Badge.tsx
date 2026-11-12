import { cn } from "@/lib/utils";
import type { Source } from "@/types";
import { FileText } from "lucide-react";

interface SourceBadgeProps {
  source: Source;
  index: number;
  onClick: (source: Source) => void;
}

export function SourceBadge({ source, index, onClick }: SourceBadgeProps) {
  return (
    <button
      onClick={() => onClick(source)}
      title={`${source.filename} — Seite ${source.page_number}`}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
        "bg-brand-900/60 text-brand-300 border border-brand-700/50",
        "hover:bg-brand-800/70 hover:border-brand-600/70 hover:text-brand-200",
        "active:bg-brand-900 transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      )}
      aria-label={`Quelle ${index + 1} anzeigen: ${source.filename}, Seite ${source.page_number}`}
    >
      <FileText className="h-3 w-3 shrink-0" aria-hidden="true" />
      <span className="max-w-[140px] truncate">{source.filename}</span>
      <span className="text-brand-400 shrink-0">S.{source.page_number}</span>
    </button>
  );
}
