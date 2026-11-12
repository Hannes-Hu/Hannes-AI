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
            ? "bg-brand-800/60 border border-brand-700/50"
            : "bg-slate-700/80 border border-slate-600/50"
        )}
        aria-hidden="true"
      >
        {isAssistant ? (
          <Bot className="h-4 w-4 text-brand-300" />
        ) : (
          <User className="h-4 w-4 text-slate-300" />
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
              ? "bg-slate-800/80 border border-slate-700/60 text-slate-200 rounded-tl-sm"
              : "bg-brand-700/80 border border-brand-600/40 text-white rounded-tr-sm"
          )}
        >
          {isAssistant ? (
            <>
              {message.error ? (
                <p className="text-red-400">{message.error}</p>
              ) : (
                <div className="prose prose-sm prose-invert max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ className, children, ...props }) {
                        const isBlock = className?.startsWith("language-");
                        return isBlock ? (
                          <code
                            className={cn(
                              "block w-full overflow-x-auto p-3 rounded-lg bg-slate-900/80 text-violet-300 font-mono text-xs border border-slate-700/50",
                              className
                            )}
                            {...props}
                          >
                            {children}
                          </code>
                        ) : (
                          <code
                            className="px-1.5 py-0.5 rounded bg-slate-700/80 text-violet-300 font-mono text-xs"
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
                            className="text-brand-400 underline underline-offset-2 hover:text-brand-300"
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
          className="text-xs text-slate-600 px-1 opacity-0 group-hover:opacity-100 transition-opacity"
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
          className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse-dot"
          style={{ animationDelay: `${i * 0.16}s` }}
        />
      ))}
    </span>
  );
}
