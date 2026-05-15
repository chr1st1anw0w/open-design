import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

vi.mock('../../src/components/ChatPaneLegacy', () => ({
  ChatPaneLegacy: () => <div data-testid="legacy-pane">legacy</div>,
}));

vi.mock('../../src/components/chat-c1/ChatPaneC1', () => ({
  ChatPaneC1: () => <div data-testid="c1-pane">c1</div>,
}));

describe('ChatPane dispatcher', () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock('../../src/lib/feature-flags');
  });

  it('renders legacy pane when flag is legacy', async () => {
    vi.doMock('../../src/lib/feature-flags', () => ({ getChatUIMode: () => 'legacy' }));
    const { ChatPane } = await import('../../src/components/ChatPane');
    const html = renderToStaticMarkup(<ChatPane {...props()} />);
    expect(html).toContain('legacy-pane');
  });

  it('renders c1 pane when flag is c1', async () => {
    vi.doMock('../../src/lib/feature-flags', () => ({ getChatUIMode: () => 'c1' }));
    const { ChatPane } = await import('../../src/components/ChatPane');
    const html = renderToStaticMarkup(<ChatPane {...props()} />);
    expect(html).toContain('c1-pane');
  });
});

function props() {
  return {
    messages: [],
    streaming: false,
    error: null,
    projectId: 'project-1',
    projectFiles: [],
    onEnsureProject: async () => 'project-1',
    onSend: () => {},
    onStop: () => {},
    conversations: [],
    activeConversationId: null,
    onSelectConversation: () => {},
    onDeleteConversation: () => {},
  };
}
