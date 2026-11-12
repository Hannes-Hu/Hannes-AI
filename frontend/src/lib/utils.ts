/**
 * Tailwind-Utility: Kombiniert clsx + tailwind-merge.
 * Verhindert Klassen-Konflikte bei konditionalen Tailwind-Klassen.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formatiert einen Dateinamen für die Anzeige (kürzt lange Namen).
 */
export function truncateFilename(filename: string, maxLength = 28): string {
  if (filename.length <= maxLength) return filename;
  const ext = filename.split(".").pop() ?? "";
  const name = filename.slice(0, maxLength - ext.length - 4);
  return `${name}...${ext ? `.${ext}` : ""}`;
}

/**
 * Formatiert Bytes in lesbare Größenangabe.
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = sizes[i];
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${size ?? "B"}`;
}

/**
 * Generiert eine einfache Client-seitige ID (kein UUID-Paket nötig).
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
