export function FileCard({
  operation,
  path,
  summary,
  status,
  resultText,
  isError,
}: {
  operation: 'write' | 'edit' | 'read';
  path: string;
  summary?: string;
  status?: string;
  resultText?: string;
  isError?: boolean;
}) {
  return (
    <div className={`c1-card c1-tool-card${isError ? ' is-error' : ''}`}>
      <div className="c1-card-head">
        <strong>{operation}</strong>
        {status ? <span className="c1-card-meta">{status}</span> : null}
      </div>
      <code className="c1-inline-code">{path}</code>
      {summary ? <div className="hint">{summary}</div> : null}
      {resultText ? <pre className="c1-result-block">{resultText}</pre> : null}
    </div>
  );
}
