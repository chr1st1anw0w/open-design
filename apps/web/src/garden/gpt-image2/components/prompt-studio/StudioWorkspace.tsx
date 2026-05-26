import React, { useState, useRef } from "react";
import type { PromptTemplate, ArgumentValue } from "../../types";
import { AiAgentPopover, SparkleIcon } from "./AiAgentPopover";

interface StudioWorkspaceProps {
  template: PromptTemplate;
  placeholders: string[];
  args: Record<string, ArgumentValue>;
  onArgsChange: (args: Record<string, ArgumentValue>) => void;
  renderedPrompt: string;
  sourceTemplate: string;
  onSave: (format: "structured" | "json-flat", tags?: string[]) => void;
}

function formatLabel(
  key: string,
  paramLabels?: Record<string, string>,
): string {
  if (paramLabels?.[key]) return paramLabels[key];
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export const StudioWorkspace: React.FC<StudioWorkspaceProps> = ({
  template,
  placeholders,
  args,
  onArgsChange,
  renderedPrompt,
  sourceTemplate,
  onSave,
}) => {
  const [activeTab, setActiveTab] = useState<"markdown" | "json">("markdown");
  const [saveFormat, setSaveFormat] = useState<"structured" | "json-flat">(
    "structured",
  );
  const [tagInput, setTagInput] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [genStatus, setGenStatus] = useState<"idle" | "generating" | "error">(
    "idle",
  );

  // AI Popover 狀態管理
  const [activeAiField, setActiveAiField] = useState<string | null>(null);
  const [isGlobalAiOpen, setIsGlobalAiOpen] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Refs 用於定位彈窗
  const fieldRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const globalBtnRef = useRef<HTMLButtonElement>(null);

  const handleChange = (key: string, value: string) => {
    onArgsChange({ ...args, [key]: value });
  };

  const handleSave = () => {
    const tags = tagInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t !== "");
    onSave(saveFormat, tags);
  };

  const handleSendToChatGPT = async () => {
    if (!renderedPrompt) return;
    setGenStatus("generating");
    try {
      const response = await fetch("/api/garden/gpt-image2/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: renderedPrompt,
          category: template.category,
          template: template.id,
          idx: template.id,
          provider: "chatgpt-web",
        }),
      });
      const data = await response.json();
      if (data.status === "success") {
        const a = document.createElement("a");
        a.href = `data:image/${data.ext};base64,${data.imageBase64}`;
        a.download = `${template.id}_${Date.now()}.${data.ext}`;
        a.click();
        setGenStatus("idle");
      } else {
        setGenStatus("error");
      }
    } catch {
      setGenStatus("error");
    }
  };

  const handleCopy = async () => {
    const textToCopy =
      activeTab === "markdown" ? renderedPrompt : JSON.stringify(args, null, 2);
    await navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAiRefineField = async (key: string, intent: string) => {
    setIsAiLoading(true);
    try {
      const response = await import("../../lib/gemini-client").then((m) =>
        m.callGeminiCopilot({
          action: "refine_field",
          intent,
          context: {
            currentFieldValue: String(args[key] ?? ""),
            targetField: key,
          },
        }),
      );
      if (response.success && response.result) {
        handleChange(key, response.result);
      }
    } catch (err) {
      console.error(err);
      alert("AI 處理失敗，請稍後再試。");
    } finally {
      setIsAiLoading(false);
      setActiveAiField(null);
    }
  };

  const handleAutoRefineField = async (key: string) => {
    // 預設最佳化指令：讓 Gemini 根據欄位名稱最佳化自然語言內容
    handleAiRefineField(
      key,
      `請根據「${formatLabel(key, template.param_labels)}」此欄位的性質，將內容最佳化得更加自然與豐富。`,
    );
  };

  const handleGlobalAiAction = async (intent: string) => {
    setIsAiLoading(true);
    try {
      const response = await import("../../lib/gemini-client").then((m) =>
        m.callGeminiCopilot({
          action: "magic_fill",
          intent,
          context: {
            placeholders,
            currentArgs: args as Record<string, string>,
            template: sourceTemplate,
          },
        }),
      );
      if (response.success && response.result) {
        onArgsChange({ ...args, ...response.result });
      }
    } catch (err) {
      console.error(err);
      alert("AI 處理失敗，請稍後再試。");
    } finally {
      setIsAiLoading(false);
      setIsGlobalAiOpen(false);
    }
  };

  const tokenEst = Math.ceil(renderedPrompt.length / 4);

  return (
    <div className="studio-workspace-grid">
      {/* 左欄：引數編輯區 */}
      <div className="argument-form">
        <div className="eyebrow mono">Configure · 填寫引數</div>
        <h2 className="serif">{template.name}</h2>
        {template.description && (
          <p className="argument-form-desc">{template.description}</p>
        )}

        <div className="form-sections-grid">
          {placeholders.length === 0 ? (
            <div className="argument-form-empty">
              <p className="text-mute">
                此模板無需填寫引數，右側為即時預覽結果。
              </p>
            </div>
          ) : (
            placeholders.map((p) => (
              <div key={p} className="form-group">
                <div className="form-group-header">
                  <label htmlFor={`arg-${p}`} style={{ marginBottom: 0 }}>
                    <span className="form-label-zh">
                      {formatLabel(p, template.param_labels)}
                    </span>
                    <span className="form-label-key mono">{p}</span>
                  </label>
                  <button
                    ref={(el) => {
                      fieldRefs.current[p] = el;
                    }}
                    className="ai-agent-icon-btn"
                    title="AI 最佳化此欄位"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveAiField(activeAiField === p ? null : p);
                    }}
                  >
                    <SparkleIcon size={14} />
                  </button>
                </div>
                <input
                  id={`arg-${p}`}
                  type="text"
                  name={p}
                  autoComplete="off"
                  value={String(args[p] ?? "")}
                  onChange={(e) => handleChange(p, e.target.value)}
                  placeholder={`請輸入 ${formatLabel(p, template.param_labels)}…`}
                />

                <AiAgentPopover
                  isOpen={activeAiField === p}
                  onClose={() => setActiveAiField(null)}
                  onRefine={(intent) => handleAiRefineField(p, intent)}
                  onAutoRefine={() => handleAutoRefineField(p)}
                  anchorRef={{ current: fieldRefs.current[p] ?? null }}
                  title={`最佳化 ${formatLabel(p, template.param_labels)}`}
                  placeholder="例如：改為賽博龐克風格、使用更專業的術語..."
                  isLoading={isAiLoading}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* 右欄：即時預覽區 */}
      <div
        className="prompt-preview-container"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--s-6)",
          animation: "none",
        }}
      >
        <div className="prompt-display-card" style={{ position: "relative" }}>
          <div
            className="form-group-header"
            style={{ marginBottom: "var(--s-4)" }}
          >
            <div className="eyebrow mono">Live Output · 即時渲染</div>
            <div style={{ display: "flex", gap: "var(--s-2)" }}>
              <button
                className={`secondary-button ${activeTab === "markdown" ? "active" : ""}`}
                style={{
                  padding: "4px 8px",
                  fontSize: "10px",
                  borderColor:
                    activeTab === "markdown"
                      ? "var(--vermilion)"
                      : "var(--line)",
                }}
                onClick={() => setActiveTab("markdown")}
              >
                Markdown
              </button>
              <button
                className={`secondary-button ${activeTab === "json" ? "active" : ""}`}
                style={{
                  padding: "4px 8px",
                  fontSize: "10px",
                  borderColor:
                    activeTab === "json" ? "var(--vermilion)" : "var(--line)",
                }}
                onClick={() => setActiveTab("json")}
              >
                JSON
              </button>
            </div>
          </div>

          <div className="code-block" style={{ minHeight: "300px" }}>
            {activeTab === "markdown"
              ? renderedPrompt || (
                  <span style={{ opacity: 0.4 }}>（尚未填寫引數）</span>
                )
              : JSON.stringify(args, null, 2)}
          </div>

          <div className="global-ai-btn-container">
            <button
              ref={globalBtnRef}
              className="global-ai-btn"
              onClick={() => setIsGlobalAiOpen(!isGlobalAiOpen)}
              title="全域 AI 助理 (Global Copilot)"
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <SparkleIcon size={14} />
              <span>AI 助理</span>
            </button>

            <AiAgentPopover
              isOpen={isGlobalAiOpen}
              onClose={() => setIsGlobalAiOpen(false)}
              onRefine={handleGlobalAiAction}
              anchorRef={globalBtnRef}
              title="全域指令與智慧填表"
              placeholder="例如：幫我填寫一張賽博龐克海報、將語氣改為學術嚴謹..."
              isLoading={isAiLoading}
            />
          </div>
        </div>

        {/* 存檔操作面板 */}
        <div
          className="control-panel"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "var(--s-6)",
            alignItems: "end",
          }}
        >
          <div>
            <div className="form-group" style={{ marginBottom: "var(--s-4)" }}>
              <label htmlFor="save-format">
                <span className="form-label-zh">儲存格式</span>
              </label>
              <select
                id="save-format"
                value={saveFormat}
                onChange={(e) =>
                  setSaveFormat(e.target.value as "structured" | "json-flat")
                }
              >
                <option value="structured">結構化 Markdown</option>
                <option value="json-flat">JSON（平面）</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="save-tags">
                <span className="form-label-zh">標籤</span>
              </label>
              <input
                id="save-tags"
                type="text"
                name="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="v2, 深色模式…"
                autoComplete="off"
              />
            </div>
          </div>
          <div
            className="form-actions"
            style={{ flexDirection: "column", marginTop: 0, gap: "var(--s-3)" }}
          >
            <button
              className="primary-button"
              onClick={handleSave}
              style={{ width: "100%" }}
            >
              存入歸檔庫
            </button>
            <button
              className="secondary-button"
              onClick={handleCopy}
              style={{ width: "100%" }}
            >
              {copied ? "✓ 已複製！" : "複製到剪貼簿"}
            </button>
            <button
              className="primary-button"
              onClick={handleSendToChatGPT}
              disabled={genStatus === "generating" || !renderedPrompt}
              style={{
                width: "100%",
                background:
                  genStatus === "error" ? "var(--vermilion)" : "#0a7c2f",
                borderColor:
                  genStatus === "error" ? "var(--vermilion)" : "#0a7c2f",
              }}
            >
              {genStatus === "generating"
                ? "生成中..."
                : genStatus === "error"
                  ? "❌ 生成失敗"
                  : "傳送到 ChatGPT"}
            </button>
            <div
              className="token-estimate mono"
              style={{
                fontSize: "10px",
                textAlign: "right",
                marginTop: "var(--s-2)",
              }}
            >
              <span>預估 Token: </span>
              <strong
                style={{
                  color:
                    tokenEst > 1000 ? "var(--vermilion)" : "var(--text-mute)",
                }}
              >
                ~{tokenEst.toLocaleString()}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
