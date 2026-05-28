// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  localStorage.clear();
  vi.resetModules();
  vi.unstubAllEnvs();
});

describe("c1 feature flags", () => {
  it("defaults to legacy when there is no override", async () => {
    // fork's b751eb7c-era decision: C1 is surfaced via a global
    // AssistantFab/AssistantSidebar instead of replacing the per-project
    // chat pane, so the default chat UI mode is `legacy`.
    const mod = await import("../../src/lib/feature-flags");
    expect(mod.getChatUIMode()).toBe("legacy");
  });

  it("prefers localStorage override", async () => {
    localStorage.setItem("od.chatUi", "c1");
    const mod = await import("../../src/lib/feature-flags");
    expect(mod.getChatUIMode()).toBe("c1");
  });

  it("toggles and persists mode", async () => {
    const mod = await import("../../src/lib/feature-flags");
    // Starts from default `legacy`; first toggle flips to `c1`.
    expect(mod.toggleChatUIMode()).toBe("c1");
    expect(localStorage.getItem("od.chatUi")).toBe("c1");
    expect(mod.toggleChatUIMode()).toBe("legacy");
  });
});
