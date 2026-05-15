export function BashCard({
  command,
  description,
  status,
  output,
  isError,
}: {
  command: string;
  description?: string;
  status?: string;
  output?: string;
  isError?: boolean;
}) {
  return (
    <div className={`c1-card c1-tool-card${isError ? ' is-error' : ''}`}>
      <div className="c1-card-head">
        <strong>Bash</strong>
        {status ? <span className="c1-card-meta">{status}</span> : null}
      </div>
      {description ? <div className="hint">{description}</div> : null}
      <pre className="c1-code-block">{command}</pre>
      {output ? <pre className="c1-result-block">{output}</pre> : null}
    </div>
  );
}
