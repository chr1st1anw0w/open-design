import {
  Component,
  type ErrorInfo,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";
import { C1Component, ThemeProvider } from "@thesysai/genui-sdk";
import type { Route } from "../../types";
import "./C1PromptExpertPanel.css";

type PromptExpertProviderStatus = {
  provider?: string;
  status?: string;
  fallbackAvailable?: boolean;
  publicAgentUrl?: string;
  apiKeySource?: string;
  identitySecretSource?: string;
  error?: string;
};

type PromptExpertChatResponse = PromptExpertProviderStatus & {
  message?: string;
  content?: string;
  actions?: Array<{
    action?: string;
    payload?: unknown;
  }>;
};

type ProviderMode = "thesys" | "open-design-fallback";

type Props = {
  navigate: (r: Route) => void;
};

type PreviewBoundaryProps = {
  response: string;
  children: ReactNode;
};

type PreviewBoundaryState = {
  failed: boolean;
};

class C1PreviewBoundary extends Component<
  PreviewBoundaryProps,
  PreviewBoundaryState
> {
  state: PreviewBoundaryState = { failed: false };

  static getDerivedStateFromError(): PreviewBoundaryState {
    return { failed: true };
  }

  componentDidUpdate(prevProps: PreviewBoundaryProps) {
    if (prevProps.response !== this.props.response && this.state.failed) {
      this.setState({ failed: false });
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn("C1 render failed", error, info.componentStack);
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="c1-pe-render-fallback">
          C1 renderer 無法解析此回應，已保留文字模式。
        </div>
      );
    }
    return this.props.children;
  }
}

function getStatusLabel(status?: string): string {
  if (!status) return "尚未連線";
  const labels: Record<string, string> = {
    "thesys-ready": "Thesys C1 可用",
    "missing-key": "缺少 THESYS_API_KEY",
    "fallback-forced": "使用本機 fallback",
    "auth-failed": "Thesys 驗證失敗",
    "rate-limited": "Thesys 速率限制",
    "upstream-error": "Thesys 上游錯誤",
  };
  return labels[status] ?? status;
}

function getProviderLabel(provider?: string): string {
  if (provider === "thesys-c1" || provider === "thesys") return "Thesys C1";
  if (provider === "open-design-fallback") return "Open Design fallback";
  return provider || "未設定";
}

function buildPrompt(input: string): string {
  return [
    "請以 Open Design GPT-Image-2 Prompt Expert 身份回答。",
    "輸出繁體中文，優先給可直接貼到提示詞欄位的內容。",
    "若適合生成 C1 interactive response，可使用 C1 可渲染格式；否則輸出清楚的文字建議。",
    "",
    input.trim(),
  ].join("\n");
}

export function C1PromptExpertPanel({ navigate }: Props) {
  const [providerStatus, setProviderStatus] =
    useState<PromptExpertProviderStatus | null>(null);
  const [providerMode, setProviderMode] = useState<ProviderMode>("thesys");
  const [input, setInput] = useState(
    "幫我把這個產品視覺提示詞改成可產生高品質 GPT-Image-2 圖像，包含主體、材質、光線、構圖、比例與限制條件。",
  );
  const [response, setResponse] = useState<PromptExpertChatResponse | null>(
    null,
  );
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const responseText = useMemo(() => {
    return response?.content || response?.message || "";
  }, [response]);

  const fetchProviderStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const res = await fetch("/api/garden/gpt-image2/prompt-expert/providers");
      const data = (await res.json()) as PromptExpertProviderStatus;
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setProviderStatus(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "讀取 provider 狀態失敗");
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    void fetchProviderStatus();
  }, []);

  const submitPrompt = async (mode: ProviderMode = providerMode) => {
    const message = input.trim();
    if (!message || isSubmitting) return;

    setIsSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/garden/gpt-image2/prompt-expert/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: mode,
          message: buildPrompt(message),
          context: {
            page: "gpt-image2-c1-panel",
            intent: "prompt-expert",
            source: "apps/web/src/garden/gpt-image2/components/c1",
          },
        }),
      });
      const data = (await res.json()) as PromptExpertChatResponse;
      setResponse(data);
      setProviderStatus((current) => ({ ...(current || {}), ...data }));
      if (!res.ok) {
        setError(data.message || data.error || `HTTP ${res.status}`);
        return;
      }
      setProviderMode(
        data.provider === "open-design-fallback"
          ? "open-design-fallback"
          : mode,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "送出失敗");
    } finally {
      setIsSubmitting(false);
    }
  };

  const status = response || providerStatus || {};
  const canFallback = Boolean(status.fallbackAvailable);

  return (
    <main className="c1-pe">
      <section className="c1-pe-shell">
        <header className="c1-pe-header">
          <button
            type="button"
            className="c1-pe-back"
            onClick={() => navigate({ name: "workbench" })}
          >
            ← 返回提示詞工作臺
          </button>
          <div>
            <span className="c1-pe-kicker mono">THESYS / C1 PROMPT EXPERT</span>
            <h1 className="serif">C1 Prompt Expert</h1>
            <p>
              以現有 daemon prompt-expert API 串接 Thesys C1，並保留需要時才手動切換的本機
              fallback。
            </p>
          </div>
        </header>

        <div className="c1-pe-grid">
          <section className="c1-pe-panel c1-pe-input-panel">
            <div className="c1-pe-panel-head">
              <h2>輸入</h2>
              <button
                type="button"
                className="c1-pe-light-btn"
                onClick={() => void fetchProviderStatus()}
                disabled={isLoadingStatus}
              >
                {isLoadingStatus ? "檢查中..." : "重新檢查"}
              </button>
            </div>

            <div className="c1-pe-status">
              <div>
                <span>Provider</span>
                <strong>{getProviderLabel(status.provider)}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{getStatusLabel(status.status)}</strong>
              </div>
              <div>
                <span>Key</span>
                <strong>{status.apiKeySource || "none"}</strong>
              </div>
            </div>

            <label className="c1-pe-mode">
              <span>送出目標</span>
              <select
                value={providerMode}
                onChange={(event) =>
                  setProviderMode(event.target.value as ProviderMode)
                }
              >
                <option value="thesys">Thesys C1</option>
                <option value="open-design-fallback">
                  Open Design fallback
                </option>
              </select>
            </label>

            <label className="c1-pe-editor">
              <span>Prompt Expert 任務</span>
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                rows={12}
              />
            </label>

            <div className="c1-pe-actions">
              <button
                type="button"
                className="c1-pe-primary-btn"
                onClick={() => void submitPrompt()}
                disabled={isSubmitting || !input.trim()}
              >
                {isSubmitting ? "送出中..." : "送出到 C1 Prompt Expert"}
              </button>
              {error && canFallback ? (
                <button
                  type="button"
                  className="c1-pe-light-btn"
                  onClick={() => void submitPrompt("open-design-fallback")}
                  disabled={isSubmitting}
                >
                  改用本機 fallback
                </button>
              ) : null}
            </div>

            {error ? <p className="c1-pe-error">{error}</p> : null}
          </section>

          <section className="c1-pe-panel c1-pe-output-panel">
            <div className="c1-pe-panel-head">
              <h2>回應</h2>
              <span className="c1-pe-pill">
                {getProviderLabel(response?.provider || status.provider)}
              </span>
            </div>

            {responseText ? (
              <div className="c1-pe-response-stack">
                <div className="c1-pe-render">
                  <C1PreviewBoundary response={responseText}>
                    <ThemeProvider>
                      <C1Component
                        key={responseText}
                        c1Response={responseText}
                        isStreaming={false}
                      />
                    </ThemeProvider>
                  </C1PreviewBoundary>
                </div>
                <pre className="c1-pe-raw">{responseText}</pre>
              </div>
            ) : (
              <div className="c1-pe-empty">
                送出 prompt 後會在這裡顯示 C1 renderer 與原始文字回應。
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
