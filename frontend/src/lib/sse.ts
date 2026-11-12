import type { StreamEvent } from "@/types";

export async function parseSSEStream(
  response: Response,
  onEvent: (event: StreamEvent) => void,
  onError: (err: Error) => void
): Promise<void> {
  if (!response.body) {
    onError(new Error("Readable stream not available on response body."));
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        const line = part.trim();
        if (!line.startsWith("data: ")) continue;

        const payload = line.slice(6);
        if (!payload || payload === "[DONE]") continue;

        try {
          const event = JSON.parse(payload) as StreamEvent;
          onEvent(event);
        } catch {}
      }
    }
  } catch (err) {
    onError(err instanceof Error ? err : new Error(String(err)));
  } finally {
    reader.releaseLock();
  }
}
