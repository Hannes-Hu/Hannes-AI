export interface DocumentInfo {
  document_id: string;
  filename: string;
  total_pages: number;
  total_chunks: number;
  collection_name: string;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  document: DocumentInfo;
}

export interface ChatRequest {
  question: string;
  conversation_id?: string;
}

export interface Source {
  document_id: string;
  filename: string;
  page_number: number;
  chunk_index: number;
  snippet: string;
  relevance_score: number;
}

export interface StreamTokenEvent {
  type: "token";
  content: string;
}

export interface StreamSourcesEvent {
  type: "sources";
  sources: Source[];
}

export interface StreamErrorEvent {
  type: "error";
  message: string;
}

export interface StreamDoneEvent {
  type: "done";
}

export type StreamEvent =
  | StreamTokenEvent
  | StreamSourcesEvent
  | StreamErrorEvent
  | StreamDoneEvent;

export type UploadStatus = "idle" | "uploading" | "success" | "error";

export interface UploadedDocument extends DocumentInfo {
  uploadedAt: Date;
  status: "ready";
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources: Source[];
  isStreaming: boolean;
  error?: string;
  timestamp: Date;
}
