import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { ChatPaneC1 } from '../../src/components/chat-c1/ChatPaneC1';

describe('ChatPaneC1', () => {
  it('renders tool events as custom cards', () => {
    const html = renderToStaticMarkup(
      <ChatPaneC1
        {...baseProps()}
        messages={[
          {
            id: 'assistant-1',
            role: 'assistant',
            content: '',
            agentName: 'Codex',
            events: [
              { kind: 'tool_use', id: 'todo-1', name: 'TodoWrite', input: { todos: [{ content: '整理簡報', status: 'in_progress' }] } },
              { kind: 'tool_result', toolUseId: 'todo-1', content: 'todo updated', isError: false },
              { kind: 'tool_use', id: 'bash-1', name: 'Bash', input: { command: 'pnpm typecheck' } },
            ],
          },
        ]}
      />,
    );
    expect(html).toContain('TodoWrite');
    expect(html).toContain('整理簡報');
    expect(html).toContain('pnpm typecheck');
  });
});

function baseProps() {
  return {
    messages: [],
    streaming: false,
    error: null,
    projectId: 'project-1',
    projectFiles: [],
    onEnsureProject: async () => 'project-1',
    attachedComments: [],
    onSend: () => {},
    onStop: () => {},
    conversations: [],
    activeConversationId: null,
    onSelectConversation: () => {},
    onDeleteConversation: () => {},
  };
}
