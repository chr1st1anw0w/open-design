# GPT Image 2：瀏覽器自動化整合（完成）

**日期**：2026-05-05
**狀態**：已實作，待測試

---

## 變更概述

將 GPT Image 2 工具從「501 未實作」升級為完整的瀏覽器自動化 + OpenAI API 雙模式方案。

---

## 修改檔案

### 1. Daemon：`apps/daemon/src/server.ts`

**變更**：

- 新增 `fs/promises` import（`mkdir`, `writeFile`）
- 取代 `/api/garden/gpt-image2/generate` 的 501 stub，實作完整邏輯
- 支援 `provider` 參數（預設 `'chatgpt-web'`）
- 路由選擇：
  - `chatgpt-web` → 呼叫 `generateMedia()` 使用 `chatgpt-web-image-opencli` model（OpenCLI 瀏覽器自動化）
  - `openai` → 呼叫 `generateMedia()` 使用 OpenAI API（需 API key）
- 結果儲存至 `RUNTIME_DATA_DIR/garden/gpt-image2/archive/<category>/<template>/<idx>.<ext>`
- 回傳 `{ status, imageBase64, ext, providerNote }`

**核心邏輯**：

```typescript
POST /api/garden/gpt-image2/generate
{
  prompt: string,
  category?: string,
  template?: string,
  idx?: string,
  provider?: 'chatgpt-web' | 'openai',  // 預設 'chatgpt-web'
  model?: string  // 若 provider='openai' 需指定 model
}
```

### 2. Frontend：`apps/web/src/garden/gpt-image2/components/shared/AutomationPanel.tsx`

**變更**：

- 新增 state：`provider: 'chatgpt-web' | 'openai'`（預設 `'chatgpt-web'`）
- 新增 state：`imagePreview: string | null`（顯示生成圖片預覽）
- UI 新增：Provider 選擇器（Radio button）
- UI 新增：提示文案「確認 Chrome 以 --remote-debugging-port=9000 啟動並登入 chatgpt.com」（當 provider 為 chatgpt-web）
- 修正 fetch 邏輯：移除 `adapter: 'playwright'`，改傳 `provider`
- 新增圖片預覽區塊（顯示 base64 圖片）
- 改進狀態訊息：區分 ChatGPT Web vs OpenAI 的進度提示
- 改進錯誤訊息：詳細顯示伺服器狀態碼與錯誤原因

### 3. Styles：`apps/web/src/garden/gpt-image2/components/shared/AutomationPanel.css`

**新增樣式**：

- `.automation-provider-selector` — Provider 選擇區塊容器
- `.provider-options` — Radio button 組
- `.provider-option` — 單一選項樣式
- `.provider-hint` — 橙色警告提示（CDP 連線要求）
- `.image-preview` — 圖片預覽容器

---

## 環境變數（已存在，無需變更）

| 變數                        | 用途             | 預設值                                        |
| --------------------------- | ---------------- | --------------------------------------------- |
| `OD_OPENCLI_BIN`            | OpenCLI 執行路徑 | `/Users/christianwu/opencli/dist/src/main.js` |
| `OD_CHATGPT_WEB_CDP_URL`    | Chrome CDP 端點  | `http://127.0.0.1:9000`                       |
| `OD_CHATGPT_WEB_TIMEOUT_MS` | 生成逾時         | `300000`（5分鐘）                             |

---

## 使用流程

### 瀏覽器自動化方式（推薦，預設）

1. **準備 Chrome**：

   ```bash
   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
     --remote-debugging-port=9000 \
     https://chatgpt.com
   ```

   並完成 ChatGPT 登入

2. **前端操作**：
   - 開啟 GPT Image 2 工具
   - 選擇「ChatGPT 網頁版（瀏覽器）」（預設選中）
   - 輸入 prompt
   - 點擊「開始生成」
   - 等待 OpenCLI 透過 CDP 自動化生成並下載

3. **結果**：
   - 圖片即時預覽在面板內
   - 儲存至 archive 目錄（若指定 category/template/idx）

### OpenAI API 方式

1. **設定 API key**：
   - 進入 Settings → Media Providers → OpenAI
   - 填入 API key，點擊儲存

2. **前端操作**：
   - 選擇「OpenAI API」
   - 輸入 prompt
   - 點擊「開始生成」

3. **結果**：
   - 圖片即時預覽在面板內
   - 儲存至 archive 目錄

---

## 測試清單

- [ ] Daemon 服務啟動，無報錯
- [ ] 瀏覽器自動化方式：
  - [ ] Chrome 以 --remote-debugging-port=9000 執行
  - [ ] 前端預設選中「ChatGPT 網頁版」
  - [ ] 輸入 prompt，點擊生成
  - [ ] 觀察狀態訊息更新（「正在透過 Chrome CDP 生成...」）
  - [ ] 圖片成功生成並在面板顯示預覽
  - [ ] Archive 目錄有圖片 + .txt（prompt 文本）
- [ ] OpenAI API 方式：
  - [ ] 設定 API key 成功
  - [ ] 切換至「OpenAI API」
  - [ ] 生成成功，圖片預覽正常
- [ ] 錯誤邊界：
  - [ ] Chrome 未連線時，顯示明確錯誤訊息
  - [ ] API key 無效時，顯示 401 或 400 錯誤
  - [ ] Prompt 為空時，按鈕禁用

---

## 依賴與關聯

- **Daemon 端**：
  - `generateMedia()` in `media.ts` — 已支援 `chatgpt-web` provider
  - `renderChatGPTWebImage()` in `media.ts` — 已實作 OpenCLI 呼叫（300s timeout）
  - `createMediaTask()`, `appendTaskProgress()` — 用於進度追蹤

- **前端**：
  - 無新增外部依賴
  - 使用現有 React 標準 hooks

---

## 後續改進方向

1. **進度回饋**：Daemon 可透過 onProgress 回呼實時推送進度（目前已支援）
2. **Batch 生成**：支援多個 prompt 順序執行
3. **Model 選擇**：Daemon 端支援多個 ChatGPT 模型版本選擇（gpt-4o, gpt-4-turbo 等）
4. **Fallback 機制**：若 ChatGPT Web 失敗，自動 fallback 到 OpenAI API（需使用者 API key）
