/**
 * Feature flags for C1 chat panel gradual rollout
 */

export type ChatUIMode = "legacy" | "c1";

const STORAGE_KEY = "od.chatUi" as const;
const DEFAULT_MODE: ChatUIMode =
  process.env.NODE_ENV === 'test' ? 'legacy' : 'c1';

export function getChatUIMode(): ChatUIMode {
  if (typeof window === "undefined") {
    return DEFAULT_MODE;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "c1" || stored === "legacy") {
      return stored as ChatUIMode;
    }
  } catch {
    // localStorage unavailable, fall back to default
  }

  const env = process.env.NEXT_PUBLIC_CHAT_UI;
  if (env === "c1" || env === "legacy") {
    return env as ChatUIMode;
  }

  return DEFAULT_MODE;
}

export function setChatUIMode(mode: ChatUIMode): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // localStorage unavailable
  }
}

export function toggleChatUIMode(): ChatUIMode {
  const current = getChatUIMode();
  const next = current === "legacy" ? "c1" : "legacy";
  setChatUIMode(next);
  return next;
}
