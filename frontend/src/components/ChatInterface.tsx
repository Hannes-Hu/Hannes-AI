"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Send, MessageSquare } from "lucide-react";
import { MessageBubble } from "@/components/MessageBubble";
import { SourceModal } from "@/components/SourceModal";
import { Button } from "@/components/ui/Button";
import { createSession, getSession, startChatStream } from "@/lib/api";
import { parseSSEStream } from "@/lib/sse";
import { generateId, cn } from "@/lib/utils";
import type { ChatMessage, SessionMessage, Source } from "@/types";

interface ChatInterfaceProps {
  sessionId: string | null;
  onSessionCreated: (id: string) => void;
  onStreamComplete?: () => void;
}

function sessionMessageToChatMessage(sm: SessionMessage): ChatMessage {
  return {
    id: sm.id,
    role: sm.role,
    content: sm.content,
    sources: sm.sources,
    isStreaming: false,
    timestamp: new Date(sm.created_at),
  };
}

export function ChatInterface({
  sessionId,
  onSessionCreated,
  onStreamComplete,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const loadedSessionIdRef = useRef<string | null>(sessionId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (sessionId === loadedSessionIdRef.current) {
      return;
    }

    loadedSessionIdRef.current = sessionId;
    setIsStreaming(false);

    if (sessionId === null) {
      setMessages([]);
      return;
    }

    let isSubscribed = true;
    getSession(sessionId)
      .then((session) => {
        if (isSubscribed) {
          setMessages(session.messages.map(sessionMessageToChatMessage));
        }
      })
      .catch((err) => {
        if (isSubscribed) {
          console.error("Failed to load session history:", err);
          setMessages([]);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, [sessionId]);

  const adjustTextareaHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInput(e.target.value);
      adjustTextareaHeight();
    },
    [adjustTextareaHeight]
  );

  const sendMessage = useCallback(async () => {
    const question = input.trim();
    if (!question || isStreaming) return;

    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    let activeSessionId = sessionId;
    if (!activeSessionId) {
      try {
        const newSession = await createSession();
        activeSessionId = newSession.id;
        loadedSessionIdRef.current = newSession.id;
        onSessionCreated(newSession.id);
      } catch (err) {
        console.error("Failed to create session:", err);
      }
    }

    const userMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      content: question,
      sources: [],
      isStreaming: false,
      timestamp: new Date(),
    };

    const assistantId = generateId();
    const assistantMessage: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      sources: [],
      isStreaming: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setIsStreaming(true);

    try {
      const response = await startChatStream(question, activeSessionId ?? undefined);

      await parseSSEStream(
        response,
        (event) => {
          setMessages((prev) =>
            prev.map((msg) => {
              if (msg.id !== assistantId) return msg;

              switch (event.type) {
                case "token":
                  return { ...msg, content: msg.content + event.content };
                case "sources":
                  return { ...msg, sources: event.sources };
                case "done":
                  return { ...msg, isStreaming: false };
                case "error":
                  return {
                    ...msg,
                    error: event.message,
                    isStreaming: false,
                  };
                default:
                  return msg;
              }
            })
          );
        },
        (err) => {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantId
                ? { ...msg, error: err.message, isStreaming: false }
                : msg
            )
          );
        }
      );
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Verbindung zum Backend fehlgeschlagen.";
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? { ...msg, error: errorMsg, isStreaming: false }
            : msg
        )
      );
    } finally {
      setIsStreaming(false);
      onStreamComplete?.();
    }
  }, [input, isStreaming, sessionId, onSessionCreated, onStreamComplete]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void sendMessage();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 pb-4 border-b border-zinc-200 dark:border-zinc-800 mb-4 transition-colors">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-zinc-700 dark:text-zinc-300" aria-hidden="true" />
          RAG-Chat
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Semantische Fragen an hochgeladene Dokumente stellen
        </p>
      </div>

      <div
        className="flex-1 overflow-y-auto space-y-5 pr-1 min-h-0"
        role="log"
        aria-label="Chatverlauf"
        aria-live="polite"
      >
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onSourceClick={setSelectedSource}
            />
          ))
        )}
        <div ref={messagesEndRef} aria-hidden="true" />
      </div>

      <div className="flex-shrink-0 pt-4 border-t border-zinc-200 dark:border-zinc-800 mt-4 transition-colors">
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder={
                isStreaming
                  ? "Antwort wird generiert…"
                  : "Frage zu Dokumenten stellen… (Enter zum Senden)"
              }
              disabled={isStreaming}
              aria-label="Nachricht eingeben"
              className={cn(
                "w-full resize-none rounded-xl px-4 py-3 text-sm",
                "bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100",
                "placeholder:text-zinc-400 dark:placeholder:text-zinc-500 leading-relaxed",
                "focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 focus:border-zinc-400 dark:focus:border-zinc-600",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all duration-150 max-h-40 overflow-y-auto"
              )}
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={!input.trim() || isStreaming}
            isLoading={isStreaming}
            aria-label="Nachricht senden"
            className="flex-shrink-0 h-[46px] px-4"
          >
            {!isStreaming && <Send className="h-4 w-4" aria-hidden="true" />}
          </Button>
        </form>
      </div>

      <SourceModal
        source={selectedSource}
        onClose={() => setSelectedSource(null)}
      />
    </div>
  );
}

function EmptyState() {
  const suggestions = [
    "Was sind die wichtigsten Erkenntnisse im Dokument?",
    "Fasse die zentralen Punkte zusammen.",
    "Welche Kennzahlen oder Fristen werden genannt?",
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 text-center py-12">
      <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        <MessageSquare className="h-8 w-8 text-zinc-600 dark:text-zinc-400" aria-hidden="true" />
      </div>
      <div>
        <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
          Bereit für Fragen
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs">
          Wähle ein Dokument aus oder ziehe ein PDF in den linken Bereich.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion}
            className="px-3 py-2 rounded-lg text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-100/70 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-left"
          >
            &ldquo;{suggestion}&rdquo;
          </div>
        ))}
      </div>
    </div>
  );
}
