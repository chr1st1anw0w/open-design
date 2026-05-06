# Thesys C1 + ElevenLabs UI 整合計劃

**建立日期**：2026-05-05  
**狀態**：📋 規劃中  
**分支**：`docs/import-sources-codex-handoff`

---

## 一、Thesys C1 整合計劃

### 背景

Thesys C1 是 Generative UI API middleware，將 LLM 輸出轉換為互動 React 元件。  
基礎設計系統：**Crayon**（Radix UI + shadcn/ui 模式）。  
OpenAI 相容端點，現有後端幾乎無需大幅修改。

### 目標

將 Open Design 的 Prompt Studio 與 Workbench 升級為**動態 AI 對話驅動的 UI**，使 AI 可在對話中即時渲染互動表單、預覽卡片與多步驟引導。

---

### Phase 1 — 後端接入（低成本，1–2 天）

**目標**：讓現有 `/api/chat` 路由透明地指向 Thesys 端點，不影響現有功能。

#### 受影響檔案

| 檔案                        | 變更                                  |
| --------------------------- | ------------------------------------- |
| `apps/daemon/src/server.ts` | 新增 `/api/chat` route，轉發至 Thesys |
| `.env.example`              | 新增 `THESYS_API_KEY=`                |

#### 實作細節

```typescript
// apps/daemon/src/server.ts — 新增 route
import OpenAI from "openai";

const thesysClient = new OpenAI({
  apiKey: process.env.THESYS_API_KEY,
  baseURL: "https://api.thesys.dev/v1/embed",
});

app.post("/api/chat", async (req, res) => {
  const { messages, stream = true } = req.body;
  const response = await thesysClient.chat.completions.create({
    model: "c1-nightly",
    messages,
    stream,
  });
  // 串流轉發
  for await (const chunk of response) {
    res.write(`data: ${JSON.stringify(chunk)}\n\n`);
  }
  res.end();
});
```

#### 驗收條件

- [ ] `curl -X POST /api/chat -d '{"messages":[{"role":"user","content":"hello"}]}'` 回傳 Thesys 串流
- [ ] 現有 GPT Image 2 generate 路由不受影響

---

### Phase 2 — 前端 SDK 安裝與隔離測試（2–3 天）

**目標**：在獨立路由 `/tools/gpt-image2/chat-test` 確認 SDK 與現有 CSS 不衝突。

#### 安裝

```bash
pnpm add @thesysai/genui-sdk @crayonai/react-ui
```

#### 受影響檔案

| 檔案                                                            | 變更             |
| --------------------------------------------------------------- | ---------------- |
| `apps/web/src/garden/gpt-image2/components/skills/ChatTest.tsx` | 新建隔離測試頁   |
| `apps/web/src/garden/gpt-image2/components/skills/ChatTest.css` | 新建樣式橋接     |
| `apps/web/src/garden/gpt-image2/index.css` 或 token 層          | CSS 變數 mapping |

#### CSS 橋接策略

Crayon 的 design token 使用 `--c1-*` 命名空間，Open Design 使用 `--bg`、`--text`、`--vermilion` 等。  
在 `ChatTest.css` 中建立橋接層：

```css
/* Crayon token → Open Design token mapping */
.chat-test-container {
  --c1-bg: var(--bg);
  --c1-surface: var(--surface);
  --c1-text: var(--text);
  --c1-accent: var(--vermilion);
  --c1-border: var(--line);
}
```

#### 測試元件

```tsx
import { C1Chat } from "@thesysai/genui-sdk";

export function ChatTest() {
  return (
    <div className="chat-test-container">
      <C1Chat apiUrl="/api/chat" formFactor="panel" theme={{ mode: "dark" }} />
    </div>
  );
}
```

#### 驗收條件

- [ ] `/tools/gpt-image2/chat-test` 路由可正常載入 C1Chat
- [ ] 背景色、文字色與 Open Design 整體風格一致
- [ ] 無 CSS 衝突（無樣式爆版）

---

### Phase 3 — Prompt Studio 對話升級（3–5 天）

**目標**：將 Prompt Studio 的靜態文字輸出替換為 C1 動態 UI，支援 AI 在對話中渲染互動提示詞表單。

#### 受影響檔案

| 檔案                                                                 | 變更                                |
| -------------------------------------------------------------------- | ----------------------------------- |
| `apps/web/src/garden/gpt-image2/components/skills/PromptStudio.tsx`  | 整合 `<C1Chat>` + 自定義 components |
| `apps/web/src/garden/gpt-image2/components/c1/PromptPreviewCard.tsx` | 新建 Custom Component               |
| `apps/web/src/garden/gpt-image2/components/c1/TemplateSelector.tsx`  | 新建 Custom Component               |

#### Custom Component 策略

```tsx
// PromptPreviewCard.tsx — AI 可在對話中直接插入
export function PromptPreviewCard({ prompt, title, category }: Props) {
  return (
    <div className="wb-preview-box">
      <span className="wb-category-tag">{category}</span>
      <h3>{title}</h3>
      <pre className="wb-code">{prompt}</pre>
      <button onClick={() => navigator.clipboard.writeText(prompt)}>
        複製
      </button>
    </div>
  );
}
```

```tsx
// Prompt Studio 整合
<C1Chat
  apiUrl="/api/chat"
  formFactor="panel"
  customizeC1={{
    customComponents: { PromptPreviewCard, TemplateSelector },
  }}
/>
```

#### 驗收條件

- [ ] 用戶輸入「我要一個 UI mockup 的提示詞」，AI 回應包含 PromptPreviewCard
- [ ] 用戶可在對話中直接複製提示詞
- [ ] Streaming 回應不造成畫面閃爍

---

### Phase 4 — Workbench 動態模板推薦（3–4 天）

**目標**：用 C1 生成的互動篩選面板取代靜態 `<select>` 模板選擇器。

#### 受影響檔案

| 檔案                                                                    | 變更                 |
| ----------------------------------------------------------------------- | -------------------- |
| `apps/web/src/garden/gpt-image2/components/skills/Workbench.tsx`        | 側欄加入 AI 推薦面板 |
| `apps/web/src/garden/gpt-image2/components/c1/TemplateSuggestPanel.tsx` | 新建 AI 推薦元件     |

#### 驗收條件

- [ ] 用戶輸入風格關鍵字（如「暗黑系產品頁」），AI 以卡片列出 3 個推薦模板
- [ ] 點擊推薦模板直接載入 Workbench

---

### 費用評估

| 情境             | 每月估算 |
| ---------------- | -------- |
| 開發測試（低頻） | < $5     |
| 上線後中度使用   | $15–40   |
| 免費額度         | $10 起始 |

---

## 二、ElevenLabs UI 整合評估

> ElevenLabs UI（`ui.elevenlabs.io`）是 ElevenLabs 的 React 元件庫，主要提供語音 AI 相關的前端元件（語音播放器、即時對話 Widget、文字轉語音控制元件）。

### 在 Open Design 可整合的場景

| 元件                         | 使用場景                                                     | 優先 |
| ---------------------------- | ------------------------------------------------------------ | ---- |
| **Conversational AI Widget** | Workbench 側欄加入語音問答：「幫我生成一個 XX 風格的提示詞」 | P1   |
| **Audio Player**             | Prompt Studio 播放 AI 語音解說（讀出提示詞重點）             | P2   |
| **Voice Input**              | Workbench 引數表單可語音輸入參數（如品牌名稱、色調描述）     | P2   |

### 整合路徑（概念）

```bash
pnpm add @elevenlabs/react
```

```tsx
import { Conversation } from "@elevenlabs/react";

// Workbench 側欄語音助理
<Conversation
  agentId={process.env.ELEVENLABS_AGENT_ID}
  onMessage={(msg) => {
    // 解析語音意圖 → 自動填入 Workbench args
    if (msg.intent === "set_brand") setArgs({ ...args, brand: msg.value });
  }}
/>;
```

### 評估結論

- **Thesys C1**：優先整合。適合 Prompt Studio + Workbench 的文字 AI 對話升級，ROI 高。
- **ElevenLabs UI**：次要整合。語音輸入適合 Workbench 引數填寫（免手動打字），但需額外 API 費用與 Agent 設定，建議在 Thesys Phase 3 完成後再評估。

---

## 三、執行順序建議

```
Thesys Phase 1 ✅  後端接入（3 天）
Thesys Phase 2 📋  隔離測試（3 天）
Thesys Phase 3 📋  Prompt Studio 升級（5 天）
Thesys Phase 4 📋  Workbench 推薦面板（4 天）
ElevenLabs     ❌  語音輸入（待 Phase 3 完成後評估）
```

---

## 四、需要用戶確認的問題

1. **THESYS_API_KEY** — 是否已申請？免費額度夠用於測試？
2. **隔離路由** — `/tools/gpt-image2/chat-test` 是否可以直接加入目前路由系統？
3. **ElevenLabs Agent ID** — 如決定整合語音，需要先在 ElevenLabs 後台建立 Conversational Agent。
4. **啟動優先序** — 是否先從 Phase 1（後端接入）開始，確認 API 可用後再進行 Phase 2？
