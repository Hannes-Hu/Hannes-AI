"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage, Source } from "@/types";
import { SourceBadge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";

interface MessageBubbleProps {
  message: ChatMessage;
  onSourceClick: (source: Source) => void;
}

export function MessageBubble({ message, onSourceClick }: MessageBubbleProps) {
  const isAssistant = message.role === "assistant";

  return (
    <div
      className={cn(
        "flex gap-3 animate-slide-up",
        isAssistant ? "flex-row" : "flex-row-reverse"
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center mt-1",
          isAssistant
            ? "bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
            : "bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700"
        )}
        aria-hidden="true"
      >
        {isAssistant ? (
          <Bot className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
        ) : (
          <User className="h-4 w-4 text-zinc-700 dark:text-zinc-300" />
        )}
      </div>

      <div
        className={cn(
          "group flex flex-col gap-2 max-w-[85%]",
          isAssistant ? "items-start" : "items-end"
        )}
      >
        <div
          className={cn(
            "px-4 py-3 rounded-2xl text-sm leading-relaxed",
            isAssistant
              ? "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tl-sm shadow-sm dark:shadow-none"
              : "bg-zinc-900 dark:bg-zinc-100 text-zinc-100 dark:text-zinc-950 rounded-tr-sm"
          )}
        >
          {isAssistant ? (
            <>
              {message.error ? (
                <p className="text-red-500 dark:text-red-400">{message.error}</p>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ className, children, ...props }) {
                        const isBlock = className?.startsWith("language-");
                        return isBlock ? (
                          <code
                            className={cn(
                              "block w-full overflow-x-auto p-3 rounded-lg bg-zinc-950 text-zinc-200 font-mono text-xs border border-zinc-800",
                              className
                            )}
                            {...props}
                          >
                            {children}
                          </code>
                        ) : (
                          <code
                            className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-mono text-xs border border-zinc-200 dark:border-zinc-700"
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      },
                      a({ href, children }) {
                        return (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-zinc-900 dark:text-zinc-100 underline underline-offset-2 hover:opacity-80"
                          >
                            {children}
                          </a>
                        );
                      },
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                  {message.isStreaming && <StreamingCursor />}
                </div>
              )}
            </>
          ) : (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}
        </div>

        {isAssistant && message.sources.length > 0 && !message.isStreaming && (
          <div
            className="flex flex-wrap gap-1.5 px-1"
            role="list"
            aria-label="Quellen"
          >
            {message.sources.map((source, i) => (
              <div key={`${source.document_id}-${source.chunk_index}`} role="listitem">
                <SourceBadge
                  source={source}
                  index={i}
                  onClick={onSourceClick}
                />
              </div>
            ))}
          </div>
        )}

        <time
          className="text-xs text-zinc-400 dark:text-zinc-600 px-1 opacity-0 group-hover:opacity-100 transition-opacity"
          dateTime={message.timestamp.toISOString()}
        >
          {message.timestamp.toLocaleTimeString("de-DE", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </time>
      </div>
    </div>
  );
}

function StreamingCursor() {
  return (
    <span
      className="inline-flex items-center gap-0.5 ml-1 align-middle"
      aria-label="Generiere"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 animate-pulse-dot"
          style={{ animationDelay: `${i * 0.16}s` }}
        />
      ))}
    </span>
  );
}
