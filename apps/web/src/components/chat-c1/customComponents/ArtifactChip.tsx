export function ArtifactChip({
  title,
  action,
  artifactId,
  refreshStatus,
  phase,
  error,
}: {
  title?: string;
  action?: string | null;
  artifactId?: string | null;
  refreshStatus?: string | null;
  phase?: string | null;
  error?: string | null;
}) {
  const meta = [action, refreshStatus, phase].filter(Boolean).join(' · ');
  return (
    <div className="c1-card c1-artifact-chip">
      <div className="c1-card-head">
        <strong>{title || 'Artifact'}</strong>
        {artifactId ? <code>{artifactId}</code> : null}
      </div>
      {meta ? <div className="hint">{meta}</div> : null}
      {error ? <div className="c1-error-text">{error}</div> : null}
    </div>
  );
}
