import type { DiffLine, SourcePatch } from './types';

export function DiffView({
  patch,
  onResolve,
}: {
  patch: SourcePatch;
  onResolve?: (strategy: 'ai' | 'manual' | 'merge') => void;
}) {
  return (
    <section className="manual-edit-diff-view" aria-label={`${patch.label} diff`}>
      <header className="manual-edit-diff-head">
        <div>
          <strong>{patch.label}</strong>
          <span>{patch.conflict ? 'Conflict detected' : 'Manual diff preview'}</span>
        </div>
        {patch.sourceBacked ? (
          <span className="manual-edit-lock-badge" title="Source-backed section. Manual edits stay locked until resolved.">
            <LockIcon />
            <em>Source-backed</em>
          </span>
        ) : null}
      </header>
      <div className="manual-edit-diff-grid">
        <DiffColumn title="Before" lines={patch.diffLines} side="before" />
        <DiffColumn title="After" lines={patch.diffLines} side="after" />
      </div>
      {onResolve ? (
        <div className="manual-edit-conflict-actions">
          <button type="button" onClick={() => onResolve('ai')}>採用 AI 版本</button>
          <button type="button" onClick={() => onResolve('manual')}>保留手動版本</button>
          <button type="button" className="primary" onClick={() => onResolve('merge')}>合併</button>
        </div>
      ) : null}
    </section>
  );
}

function DiffColumn({
  title,
  lines,
  side,
}: {
  title: string;
  lines: DiffLine[];
  side: 'before' | 'after';
}) {
  return (
    <div className="manual-edit-diff-column">
      <div className="manual-edit-diff-column-head">{title}</div>
      <div className="manual-edit-diff-lines">
        {lines.map((line) => (
          <div key={`${side}-${line.key}`} className={`manual-edit-diff-line diff-${line.kind}`}>
            <span className="manual-edit-diff-gutter">
              {side === 'before' ? line.beforeNumber ?? '·' : line.afterNumber ?? '·'}
            </span>
            <code className="manual-edit-diff-code">
              {side === 'before' ? line.beforeText || ' ' : line.afterText || ' '}
            </code>
            {line.lockedBy === 'user' && side === 'after' ? (
              <span className="manual-edit-diff-line-lock" title="Locked by manual edit. Later AI patch should skip this line.">
                <LockIcon />
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path
        d="M5 6V4.75a3 3 0 1 1 6 0V6h.75c.69 0 1.25.56 1.25 1.25v5.5c0 .69-.56 1.25-1.25 1.25h-7.5C3.56 14 3 13.44 3 12.75v-5.5C3 6.56 3.56 6 4.25 6H5Zm1.25 0h3.5V4.75a1.75 1.75 0 1 0-3.5 0V6Z"
        fill="currentColor"
      />
    </svg>
  );
}
