import type { ResolvedPatch, SourcePatch } from './types';

export function resolveConflict(
  patch: SourcePatch,
  strategy: 'ai' | 'manual' | 'merge',
): ResolvedPatch {
  if (strategy === 'ai') {
    return {
      ...patch,
      resolution: 'ai',
      resolvedSource: patch.aiSource,
    };
  }
  if (strategy === 'manual') {
    return {
      ...patch,
      resolution: 'manual',
      resolvedSource: patch.manualSource,
    };
  }
  return {
    ...patch,
    resolution: 'merge',
    resolvedSource: mergeConflictSource(patch),
  };
}

function mergeConflictSource(patch: SourcePatch): string {
  const aiLines = normalizeLines(patch.aiSource);
  const manualLines = normalizeLines(patch.manualSource);
  const merged = [...aiLines];
  for (const lock of patch.lockedLines) {
    if (lock.afterNumber == null) continue;
    const targetIndex = lock.afterNumber - 1;
    const manualLine = manualLines[targetIndex];
    if (manualLine == null) continue;
    merged[targetIndex] = manualLine;
  }
  return merged.join('\n');
}

function normalizeLines(source: string): string[] {
  return source.replace(/\r\n/g, '\n').split('\n');
}
