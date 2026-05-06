import React from 'react';
import type { PromptTemplate, ArgumentValue } from '../../types';

interface ArgumentFormProps {
  template: PromptTemplate;
  placeholders: string[];
  args: Record<string, ArgumentValue>;
  onArgsChange: (args: Record<string, ArgumentValue>) => void;
  onNext: () => void;
}

// 把英文 key 轉為較友善的顯示名稱
function formatLabel(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export const ArgumentForm: React.FC<ArgumentFormProps> = ({
  template,
  placeholders,
  args,
  onArgsChange,
  onNext
}) => {
  const handleChange = (key: string, value: string) => {
    onArgsChange({ ...args, [key]: value });
  };

  const allFilled = placeholders.every(p => String(args[p] ?? '').trim().length > 0);

  return (
    <div className="argument-form">
      <div className="eyebrow mono">Configure · 填寫引數</div>
      <h2 className="serif">{template.name}</h2>
      {template.description && (
        <p className="argument-form-desc">{template.description}</p>
      )}

      <div className="form-sections-grid">
        {placeholders.length === 0 ? (
          <div className="argument-form-empty">
            <p className="text-mute">此模板無需填寫引數，可直接預覽。</p>
          </div>
        ) : (
          placeholders.map(p => (
            <div key={p} className="form-group">
              <label htmlFor={`arg-${p}`}>
                <span className="form-label-zh">{formatLabel(p)}</span>
                <span className="form-label-key mono">{p}</span>
              </label>
              <input
                id={`arg-${p}`}
                type="text"
                name={p}
                autoComplete="off"
                value={String(args[p] ?? '')}
                onChange={e => handleChange(p, e.target.value)}
                placeholder={`請輸入 ${formatLabel(p)}…`}
              />
            </div>
          ))
        )}
      </div>

      <div className="form-actions">
        <button
          className="primary-button"
          onClick={onNext}
          disabled={placeholders.length > 0 && !allFilled}
          title={placeholders.length > 0 && !allFilled ? '請填寫所有欄位' : ''}
        >
          預覽提示詞 <span aria-hidden="true">→</span>
        </button>
        {placeholders.length > 0 && !allFilled && (
          <span className="form-hint mono">請填寫所有欄位後繼續</span>
        )}
      </div>
    </div>
  );
};
