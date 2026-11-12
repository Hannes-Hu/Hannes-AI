import type { ChatSession, SessionWithMessages, UploadResponse } from "@/types";

const API_BASE = "/api/v1";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: string
  ) {
    super(detail);
    this.name = "ApiError";
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const rawText = await res.text();

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = JSON.parse(rawText) as { detail?: string };
      detail = body.detail ?? rawText ?? detail;
    } catch {
      detail = rawText || detail;
    }
    throw new ApiError(res.status, detail);
  }

  try {
    return JSON.parse(rawText) as T;
  } catch {
    throw new ApiError(res.status, "Invalid JSON payload returned from API.");
  }
}

export async function uploadDocument(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData,
  });

  return handleResponse<UploadResponse>(res);
}

export async function startChatStream(question: string, sessionId?: string): Promise<Response> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, session_id: sessionId, conversation_id: sessionId }),
  });

  if (!res.ok || !res.body) {
    let detail = `HTTP ${res.status}`;
    try {
      const rawText = await res.text();
      try {
        const body = JSON.parse(rawText) as { detail?: string };
        detail = body.detail ?? rawText ?? detail;
      } catch {
        detail = rawText || detail;
      }
    } catch {}
    throw new ApiError(res.status, detail);
  }

  return res;
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch("/health", { cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

export async function createSession(title?: string): Promise<ChatSession> {
  const res = await fetch(`${API_BASE}/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: title ?? null }),
  });
  return handleResponse<ChatSession>(res);
}

export async function getSession(sessionId: string): Promise<SessionWithMessages> {
  const res = await fetch(`${API_BASE}/sessions/${sessionId}`, {
    cache: "no-store",
  });
  return handleResponse<SessionWithMessages>(res);
}

export async function listSessions(): Promise<ChatSession[]> {
  const res = await fetch(`${API_BASE}/sessions`, { cache: "no-store" });
  return handleResponse<ChatSession[]>(res);
}
