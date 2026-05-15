import type { TodoItem } from '../../../runtime/todos';

export function TodoWriteCard({
  items,
  status,
  resultText,
  isError,
}: {
  items: TodoItem[];
  status?: string;
  resultText?: string;
  isError?: boolean;
}) {
  return (
    <div className={`c1-card c1-tool-card${isError ? ' is-error' : ''}`}>
      <div className="c1-card-head">
        <strong>TodoWrite</strong>
        {status ? <span className="c1-card-meta">{status}</span> : null}
      </div>
      <ul className="c1-todo-list">
        {items.map((item, index) => (
          <li key={`${item.content}-${index}`} className={`c1-todo-item is-${item.status}`}>
            <span className="c1-todo-state" aria-hidden>
              {item.status === 'completed' ? '✓' : item.status === 'in_progress' ? '◐' : '○'}
            </span>
            <span>{item.activeForm || item.content}</span>
          </li>
        ))}
      </ul>
      {resultText ? <div className="hint">{resultText}</div> : null}
    </div>
  );
}
