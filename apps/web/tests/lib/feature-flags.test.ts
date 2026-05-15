// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  localStorage.clear();
  vi.resetModules();
  vi.unstubAllEnvs();
});

describe('c1 feature flags', () => {
  it('defaults to c1 when there is no override', async () => {
    const mod = await import('../../src/lib/feature-flags');
    expect(mod.getChatUIMode()).toBe('c1');
  });

  it('prefers localStorage override', async () => {
    localStorage.setItem('od.chatUi', 'c1');
    const mod = await import('../../src/lib/feature-flags');
    expect(mod.getChatUIMode()).toBe('c1');
  });

  it('toggles and persists mode', async () => {
    const mod = await import('../../src/lib/feature-flags');
    expect(mod.toggleChatUIMode()).toBe('legacy');
    expect(localStorage.getItem('od.chatUi')).toBe('legacy');
    expect(mod.toggleChatUIMode()).toBe('c1');
  });
});
