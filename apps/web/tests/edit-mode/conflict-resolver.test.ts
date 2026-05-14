import { describe, expect, it } from 'vitest';
import { resolveConflict } from '../../src/edit-mode/conflict-resolver';
import { buildSourcePatch } from '../../src/edit-mode/source-patches';

describe('manual edit conflict resolver', () => {
  it('builds line diffs and locked lines for manual patches', () => {
    const patch = buildSourcePatch({
      id: 'history-1',
      label: 'Content: Hero',
      patch: { id: 'hero-title', kind: 'set-text', value: 'Manual title' },
      baseSource: '<h1>Original</h1>\n<p>Body</p>',
      aiSource: '<h1>AI title</h1>\n<p>Body</p>',
      manualSource: '<h1>Manual title</h1>\n<p>Body</p>',
      targetId: 'hero-title',
      sourceBacked: true,
    });

    expect(patch.conflict).toBe(true);
    expect(patch.sourceBacked).toBe(true);
    expect(patch.diffLines.some((line) => line.kind === 'modify')).toBe(true);
    expect(patch.lockedLines).toEqual([{ beforeNumber: 1, afterNumber: 1, lockedBy: 'user' }]);
  });

  it('keeps AI output when strategy is ai', () => {
    const patch = buildSourcePatch({
      id: 'history-2',
      label: 'Style: Card',
      patch: { id: 'card', kind: 'set-style', styles: { padding: '24px' } },
      baseSource: '<section>Base</section>',
      aiSource: '<section>AI</section>',
      manualSource: '<section>Manual</section>',
    });

    const resolved = resolveConflict(patch, 'ai');
    expect(resolved.resolution).toBe('ai');
    expect(resolved.resolvedSource).toBe('<section>AI</section>');
  });

  it('replays user-locked lines into merge output', () => {
    const patch = buildSourcePatch({
      id: 'history-3',
      label: 'Content: Hero',
      patch: { id: 'hero-title', kind: 'set-text', value: 'Manual title' },
      baseSource: '<h1>Original</h1>\n<p>Body</p>',
      aiSource: '<h1>AI title</h1>\n<p>AI body</p>',
      manualSource: '<h1>Manual title</h1>\n<p>Body</p>',
    });

    const resolved = resolveConflict(patch, 'merge');
    expect(resolved.resolution).toBe('merge');
    expect(resolved.resolvedSource).toBe('<h1>Manual title</h1>\n<p>AI body</p>');
  });
});
