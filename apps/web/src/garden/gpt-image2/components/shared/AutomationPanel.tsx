import { useState } from "react";
import "./AutomationPanel.css";

export function AutomationPanel() {
  const [prompt, setPrompt] = useState("");
  const [category, setCategory] = useState("product-visuals");
  const [template] = useState("product-hero");
  const [idx, setIdx] = useState("105");
  const [provider, setProvider] = useState<"chatgpt-web" | "openai">(
    "chatgpt-web",
  );
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setStatus("❌ 請輸入提示詞");
      return;
    }

    setLoading(true);
    setImagePreview(null);

    const statusMsg =
      provider === "chatgpt-web"
        ? "🚀 正在透過 Chrome CDP 生成圖片..."
        : "🚀 正在透過 OpenAI API 生成圖片...";
    setStatus(statusMsg);

    try {
      const response = await fetch("/api/garden/gpt-image2/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          category,
          template,
          idx,
          provider,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        setStatus(
          `❌ 伺服器錯誤 (${response.status}): ${data.error || "Unknown error"}`,
        );
        return;
      }

      const data = await response.json();
      if (data.status === "success") {
        setImagePreview(`data:image/${data.ext};base64,${data.imageBase64}`);
        setStatus(`✅ 生成成功！${data.providerNote || ""}`);
      } else {
        setStatus(`❌ 失敗: ${data.error}`);
      }
    } catch (err) {
      setStatus(
        `❌ 連線失敗: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="automation-panel">
      <div className="automation-header">
        <h3 className="serif">圖片自動化生成</h3>
        <span className="mono status-badge">
          {provider === "chatgpt-web" ? "CDP @ 9000" : "OpenAI API"}
        </span>
      </div>

      <div className="automation-provider-selector">
        <label className="mono">生成方式</label>
        <div className="provider-options">
          <label className="provider-option">
            <input
              type="radio"
              name="provider"
              value="chatgpt-web"
              checked={provider === "chatgpt-web"}
              onChange={(e) => setProvider(e.target.value as "chatgpt-web")}
              disabled={loading}
            />
            <span>ChatGPT 網頁版（瀏覽器）</span>
          </label>
          <label className="provider-option">
            <input
              type="radio"
              name="provider"
              value="openai"
              checked={provider === "openai"}
              onChange={(e) => setProvider(e.target.value as "openai")}
              disabled={loading}
            />
            <span>OpenAI API</span>
          </label>
        </div>
        {provider === "chatgpt-web" && (
          <div className="provider-hint mono">
            ⚠️ 需確認 Chrome 以 --remote-debugging-port=9000 啟動並登入
            chatgpt.com
          </div>
        )}
      </div>

      <div className="automation-fields">
        <div className="field">
          <label className="mono">提示詞 PROMPT</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="輸入圖片描述..."
            disabled={loading}
          />
        </div>

        <div className="field-group">
          <div className="field">
            <label className="mono">分類 CATEGORY</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="field">
            <label className="mono">索引 INDEX</label>
            <input
              value={idx}
              onChange={(e) => setIdx(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>
      </div>

      <button
        className={`btn btn-primary ${loading ? "loading" : ""}`}
        onClick={handleGenerate}
        disabled={loading || !prompt.trim()}
      >
        <span>{loading ? "生成中..." : "開始生成"}</span>
      </button>

      {imagePreview && (
        <div className="image-preview">
          <img src={imagePreview} alt="Generated" />
        </div>
      )}

      {status && <div className="automation-status mono">{status}</div>}
    </div>
  );
}
