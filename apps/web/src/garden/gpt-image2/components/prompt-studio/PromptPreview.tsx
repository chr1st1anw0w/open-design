import React, { useState } from 'react';
import type { PromptTemplate } from '../../types';

interface PromptPreviewProps {
  template: PromptTemplate;
  renderedPrompt: string;
  sourceTemplate: string;
  onBack: () => void;
  onSave: (format: 'structured' | 'json-flat', tags?: string[]) => void;
}

export const PromptPreview: React.FC<PromptPreviewProps> = ({
  template,
  renderedPrompt,
  sourceTemplate,
  onBack,
  onSave
}) => {
  const [format, setFormat] = useState<'structured' | 'json-flat'>('structured');
  const [tagInput, setTagInput] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const handleSave = () => {
    const tags = tagInput.split(',').map(t => t.trim()).filter(t => t !== '');
    onSave(format, tags);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(renderedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tokenEst = Math.ceil(renderedPrompt.length / 4);

  return (
    <div className="prompt-preview-container">
      {/* 主要提示詞預覽 */}
      <div className="prompt-display-card">
        <div className="prompt-section">
          <div className="eyebrow mono">Generated Prompt · 生成結果</div>
          <h3 className="serif">{template.name}</h3>
          <div className="code-block">{renderedPrompt || <span style={{ opacity: 0.4 }}>（尚未填寫引數）</span>}</div>
        </div>

        <div className="prompt-section">
          <div className="eyebrow mono">Source Template · 原始模板</div>
          <div className="code-block" style={{ opacity: 0.55, fontSize: '12px' }}>
            {sourceTemplate || '（無模板內容）'}
          </div>
        </div>
      </div>

      {/* 側邊欄操作面板 */}
      <div className="preview-sidebar">
        <div className="control-panel">
          <div className="eyebrow mono">Archive Action · 歸檔操作</div>
          <h2 className="serif" style={{ fontSize: '1.8rem', margin: 'var(--s-2) 0 var(--s-6)' }}>
            儲存提示詞
          </h2>

          <div className="form-group">
            <label htmlFor="save-format">
              <span className="form-label-zh">儲存格式</span>
              <span className="form-label-key">Storage Format</span>
            </label>
            <select
              id="save-format"
              value={format}
              onChange={e => setFormat(e.target.value as 'structured' | 'json-flat')}
            >
              <option value="structured">結構化 Markdown</option>
              <option value="json-flat">JSON（平面）</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="save-tags">
              <span className="form-label-zh">標籤</span>
              <span className="form-label-key">Tags（逗號分隔）</span>
            </label>
            <input
              id="save-tags"
              type="text"
              name="tags"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              placeholder="v2, 深色模式, 極簡…"
              autoComplete="off"
            />
          </div>

          <div className="form-actions" style={{ flexDirection: 'column' }}>
            <button className="primary-button" onClick={handleSave} style={{ width: '100%' }}>
              存入歸檔庫
            </button>
            <button className="secondary-button" onClick={handleCopy} style={{ width: '100%' }}>
              {copied ? '✓ 已複製！' : '複製到剪貼簿'}
            </button>
            <button
              className="secondary-button"
              onClick={onBack}
              style={{ width: '100%', border: 'none', color: 'var(--text-faint)' }}
            >
              ← 返回引數設定
            </button>
          </div>
        </div>

        <div className="token-estimate mono">
          <span>預估 Token 數</span>
          <strong style={{ color: tokenEst > 1000 ? 'var(--vermilion)' : 'var(--text-mute)' }}>
            ~{tokenEst.toLocaleString()}
          </strong>
        </div>
      </div>
    </div>
  );
};
