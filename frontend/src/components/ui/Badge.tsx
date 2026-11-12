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
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer",
        "bg-zinc-100 text-zinc-700 border border-zinc-200",
        "hover:bg-zinc-200 hover:border-zinc-300 hover:text-zinc-900",
        "dark:bg-zinc-900 dark:text-zinc-300 dark:border-zinc-800",
        "dark:hover:bg-zinc-800 dark:hover:border-zinc-700 dark:hover:text-zinc-100",
        "transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500"
      )}
      aria-label={`Quelle ${index + 1} anzeigen: ${source.filename}, Seite ${source.page_number}`}
    >
      <FileText className="h-3 w-3 shrink-0 text-zinc-500 dark:text-zinc-400" aria-hidden="true" />
      <span className="max-w-[140px] truncate">{source.filename}</span>
      <span className="text-zinc-500 dark:text-zinc-400 shrink-0">S.{source.page_number}</span>
    </button>
  );
}
