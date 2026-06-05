/**
 * Prompt Expert client (Thesys C1 first, Open Design fallback optional).
 * Kept under the historical filename to avoid touching all call sites.
 */

export interface AiRefineRequest {
  action: "refine_field" | "refine_global" | "magic_fill";
  intent: string;
  context?: {
    template?: string;
    placeholders?: string[];
    currentArgs?: Record<string, string>;
    targetField?: string;
    currentFieldValue?: string;
    [key: string]: unknown;
  };
}

type PromptExpertAction = {
  action?: string;
  payload?: unknown;
};

type PromptExpertResponse = {
  provider?: string;
  status?: string;
  message?: string;
  content?: string;
  fallbackAvailable?: boolean;
  actions?: PromptExpertAction[];
};

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function stripCodeFence(input: string): string {
  const text = input.trim();
  if (!text.startsWith("```")) return text;
  return text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

function extractJsonObject(input: string): Record<string, string> | null {
  const text = stripCodeFence(input);
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(text.slice(start, end + 1));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed)) {
      out[String(k)] = typeof v === "string" ? v : JSON.stringify(v);
    }
    return out;
  } catch {
    return null;
  }
}

function parseActionPayload(
  action: "refine_field" | "magic_fill",
  actions: PromptExpertAction[] | undefined,
): string | Record<string, string> | null {
  if (!Array.isArray(actions)) return null;
  for (const item of actions) {
    if (!item || typeof item !== "object") continue;
    const id = cleanString(item.action);
    if (action === "refine_field" && id === "refine_field") {
      const payload = item.payload as Record<string, unknown> | undefined;
      const result = cleanString(payload?.value ?? payload?.text ?? payload?.result);
      if (result) return result;
    }
    if (action === "magic_fill" && id === "magic_fill") {
      const payload = item.payload;
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) continue;
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(payload as Record<string, unknown>)) {
        out[k] = typeof v === "string" ? v : JSON.stringify(v);
      }
      if (Object.keys(out).length > 0) return out;
    }
  }
  return null;
}

function buildPrompt(request: AiRefineRequest): string {
  const intent = cleanString(request.intent);
  if (request.action === "refine_field") {
    return [
      "請只輸出最佳化後內容本體，不要多餘解釋，不要 markdown。",
      `目標欄位: ${cleanString(request.context?.targetField) || "unknown"}`,
      `目前內容: ${cleanString(request.context?.currentFieldValue) || "(empty)"}`,
      `使用者意圖: ${intent}`,
    ].join("\n");
  }
  if (request.action === "magic_fill") {
    const placeholders = request.context?.placeholders ?? [];
    return [
      "請根據使用者意圖補全模板欄位。",
      "回傳格式必須是純 JSON 物件，key=欄位名，value=字串，不要 markdown。",
      `欄位清單: ${placeholders.join(", ") || "(none)"}`,
      `使用者意圖: ${intent}`,
    ].join("\n");
  }
  return intent;
}

export async function callGeminiCopilot(request: AiRefineRequest): Promise<any> {
  if (request.action === "refine_global") {
    return { success: false, error: "refine_global is not implemented" };
  }
  const message = buildPrompt(request);
  try {
    const response = await fetch("/api/garden/gpt-image2/prompt-expert/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: "thesys",
        message,
        context: request.context || {},
      }),
    });
    const data = (await response.json()) as PromptExpertResponse;
    if (!response.ok) {
      return {
        success: false,
        error: cleanString(data.message) || cleanString(data.content) || `HTTP ${response.status}`,
        provider: cleanString(data.provider) || "thesys-c1",
        status: cleanString(data.status) || "error",
      };
    }

    const provider = cleanString(data.provider) || "thesys-c1";
    const status = cleanString(data.status) || "ok";
    const content = cleanString(data.content);

    if (request.action === "refine_field") {
      const fromAction = parseActionPayload("refine_field", data.actions);
      const result =
        typeof fromAction === "string"
          ? fromAction
          : stripCodeFence(content);
      if (!result) {
        return { success: false, error: "AI 回傳空內容", provider, status };
      }
      return { success: true, result, provider, status };
    }

    const fromAction = parseActionPayload("magic_fill", data.actions);
    const parsed =
      (fromAction && typeof fromAction === "object" ? fromAction : null) ||
      extractJsonObject(content);
    if (!parsed) {
      return {
        success: false,
        error: "AI 未回傳有效 JSON",
        provider,
        status,
        raw: content,
      };
    }
    return { success: true, result: parsed, provider, status };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "request failed",
      provider: "thesys-c1",
      status: "request-failed",
    };
  }
}

