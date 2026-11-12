"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Plus, Clock } from "lucide-react";
import { listSessions } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { ChatSession } from "@/types";

interface SessionSidebarProps {
  activeSessionId: string | null;
  onSessionSelect: (id: string) => void;
  onNewSession: () => void;
  revision?: number;
}

function formatRelativeDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Gerade eben";
  if (diffMins < 60) return `vor ${diffMins} Min.`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `vor ${diffHours} Std.`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `vor ${diffDays} Tag${diffDays > 1 ? "en" : ""}`;
  return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}

function sessionLabel(session: ChatSession): string {
  if (session.title) return session.title;
  const date = new Date(session.created_at);
  return `Chat vom ${date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" })}`;
}

export function SessionSidebar({
  activeSessionId,
  onSessionSelect,
  onNewSession,
  revision = 0,
}: SessionSidebarProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  useEffect(() => {
    listSessions()
      .then(setSessions)
      .catch(() => {});
  }, [activeSessionId, revision]);

  return (
    <aside
      className="flex flex-col h-full border-r border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 overflow-hidden transition-colors duration-150"
      aria-label="Chat-Verlauf"
    >
      <div className="flex-shrink-0 px-3 pt-5 pb-3 border-b border-zinc-200 dark:border-zinc-800/80">
        <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Clock className="h-3 w-3" aria-hidden="true" />
          Verlauf
        </h2>
        <button
          type="button"
          onClick={onNewSession}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium",
            "bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-200",
            "dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-800 transition-colors duration-150"
          )}
        >
          <Plus className="h-4 w-4 flex-shrink-0 text-zinc-600 dark:text-zinc-300" aria-hidden="true" />
          Neuer Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2">
        {sessions.length === 0 ? (
          <p className="text-xs text-zinc-400 dark:text-zinc-600 text-center pt-6 px-2">
            Noch keine Chats
          </p>
        ) : (
          sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            return (
              <button
                key={session.id}
                type="button"
                onClick={() => onSessionSelect(session.id)}
                className={cn(
                  "w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors duration-100 group",
                  isActive
                    ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100 font-medium"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900/50 dark:hover:text-zinc-200"
                )}
                aria-current={isActive ? "true" : undefined}
              >
                <MessageSquare
                  className={cn(
                    "h-3.5 w-3.5 flex-shrink-0 mt-0.5",
                    isActive
                      ? "text-zinc-800 dark:text-zinc-200"
                      : "text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-600 dark:group-hover:text-zinc-400"
                  )}
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs truncate leading-snug">
                    {sessionLabel(session)}
                  </p>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-600 mt-0.5">
                    {formatRelativeDate(session.created_at)}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
