import { describe, expect, it } from 'vitest';
import { mapAgentEventsToC1Blocks, mapDaemonEventToC1Xml } from '../../src/lib/c1-bridge/event-mapper';

describe('c1 event mapper', () => {
  it('maps text deltas to text content blocks', () => {
    const xml = mapDaemonEventToC1Xml({ type: 'text_delta', delta: 'hello' });
    expect(xml).toContain('type="text"');
    expect(xml).toContain('hello');
  });

  it('maps tool use to structured tool block', () => {
    const xml = mapDaemonEventToC1Xml({ type: 'tool_use', id: '1', name: 'todowrite', input: { todos: [{ content: 'step 1' }] } });
    expect(xml).toContain('type="component"');
    expect(xml).toContain('TodoWriteCard');
  });

  it('maps live artifact events', () => {
    const xml = mapDaemonEventToC1Xml({ type: 'live_artifact', action: 'created', projectId: 'p1', artifactId: 'a1', title: 'Deck' });
    expect(xml).toContain('type="component"');
    expect(xml).toContain('ArtifactChip');
    expect(xml).toContain('Deck');
  });

  it('pairs tool use with tool result for file cards', () => {
    const blocks = mapAgentEventsToC1Blocks([
      { kind: 'tool_use', id: '1', name: 'Write', input: { file_path: '/tmp/demo.ts', content: 'hello' } },
      { kind: 'tool_result', toolUseId: '1', content: 'wrote file', isError: false },
    ]);
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({
      type: 'component',
      component: 'FileCard',
      props: { path: '/tmp/demo.ts', resultText: 'wrote file', status: 'complete' },
    });
  });
});
