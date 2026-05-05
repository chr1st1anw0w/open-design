# ChatGPT Web Image Generation via OpenCLI — Complete Setup & Testing Plan

## 📋 Overview

本計劃涵蓋如何透過 OpenCLI 在 Chrome 中連接到 ChatGPT 並使用 DALL-E 生成圖片。整個流程分為三層：

1. **Chrome Remote Debugging** — 本機 Chrome 實例提供 CDP 連線
2. **OpenCLI** — 自動化工具，透過 CDP 操控 ChatGPT Web UI  path: /Users/christianwu/opencli/
3. **Web Frontend** — 前端透過後端 API 呼叫 OpenCLI，收集生成結果

---

## 🎯 Architecture & Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  Frontend (Workbench.tsx)                                    │
│  ├─ User selects template & clicks "傳送到 ChatGPT"        │
│  └─ POST /api/garden/gpt-image2/generate                    │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Backend (server.ts + media.ts)                              │
│  ├─ Validate request                                        │
│  ├─ Call generateMedia()                                    │
│  ├─ Call renderChatGPTWebImage()                            │
│  │  ├─ Validate prerequisites (opencli binary, CDP port)    │
│  │  └─ Spawn opencli child process                          │
│  ├─ Collect error diagnostics (detectChatGPTError)          │
│  └─ Return API response: { error: { code, message } }       │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  OpenCLI (local binary)                                      │
│  ├─ Connect to Chrome CDP (localhost:9000)                  │
│  ├─ Navigate to ChatGPT                                     │
│  ├─ Fill prompt & submit to DALL-E                          │
│  ├─ Wait for image generation                               │
│  └─ Download image to temp directory                        │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Chrome (Remote Debugging)                                  │
│  ├─ Running with --remote-debugging-port=9000              │
│  ├─ User logged into ChatGPT                                │
│  └─ Listening for CDP connections                           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Prerequisites Checklist

- [ ] `opencli` binary installed and accessible in PATH
- [ ] Chrome browser with ChatGPT account logged in
- [ ] Development server running (`pnpm tools-dev start web`)
- [ ] `/tmp/chrome-profile-copy/Default` directory exists
- [ ] Node.js 18+ and pnpm installed

---

## 🚀 Complete Setup Steps

### Step 1: Prepare Chrome Profile

一次性準備，用來保存登入狀態。

```bash
# 複製現有的 Chrome Default profile
cp -r ~/Library/Application\ Support/Google/Chrome/Default \
      /tmp/chrome-profile-copy/Default

# 確認目錄存在
ls -la /tmp/chrome-profile-copy/Default | head -5
# 應顯示: Default/Current Session, Default/Cookies, Default/History 等
```

**驗證：** `/tmp/chrome-profile-copy/Default` 應包含 `Cookies` 和 `History` 檔案。

---

### Step 2: Start Chrome with Remote Debugging

開啟一個 Terminal，啟動 Chrome 並監聽 CDP 連線。

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9000 \
  --user-data-dir=/tmp/chrome-profile-copy \
  --profile-directory=Default
```

**驗證：**

- Chrome 視窗應出現並自動載入上次的分頁
- 檢查是否自動登入 ChatGPT：進入 https://chatgpt.com
- 若未登入，手動登入並關閉 Chrome 再重新啟動（profile 會記住登入狀態）
- Terminal 無錯誤訊息

---

### Step 3: Start Development Server

新開一個 Terminal，啟動 open-design 開發伺服器。

```bash
cd /Users/christianwu/open-design
pkill -f tools-dev || true  # 停止任何現有的 dev 伺服器
pnpm tools-dev start web
```

**驗證：**

```bash
curl -s http://localhost:17573 | grep -q "<!DOCTYPE" && echo "✓ Web server ready"
```

---

### Step 4: Access Workbench & Test Generation

在瀏覽器中開啟新分頁（不是執行中的 Chrome 實例，而是另一個瀏覽器或分頁）：

```
http://localhost:17573/tools/gpt-image2/workbench
```

**操作流程：**

1. 選擇「template」或「gallery」模式
2. 點選一個範本或圖片
3. 查看「提示詞全文 PROMPT」區塊
4. 點擊「傳送到 ChatGPT」按鈕

**預期結果：**

- 按鈕進入「生成中...」狀態
- 約 15-30 秒後，應顯示：
  - ✅ 成功：圖片縮圖 + 「已下載至本機」訊息
  - ❌ 失敗：詳細錯誤訊息（見下方故障排查）

---

## 🔍 Error Messages & Diagnostics

若生成失敗，前端會顯示詳細診斷訊息，幫助識別根本原因。

### 常見錯誤訊息與解決方案

| 錯誤訊息                                  | 原因                           | 解決方案                                                |
| ----------------------------------------- | ------------------------------ | ------------------------------------------------------- |
| **Chrome 遠程調試連線失敗**               | Chrome 未在 port 9000 監聽     | 確認 Chrome 啟動命令包含 `--remote-debugging-port=9000` |
| **ChatGPT login expired or 2FA required** | 登入過期或需要二次驗證         | 在 Chrome 中手動登入 ChatGPT，再重新啟動 Chrome         |
| **Access denied — DALL-E access**         | 帳號無 DALL-E 生成權限         | 升級 ChatGPT Plus 或檢查帳號設定                        |
| **ChatGPT UI element not found**          | UI 選擇器已變更                | OpenCLI 需更新以適應 ChatGPT UI 變更                    |
| **Rate limited**                          | 請求過於頻繁                   | 等待 5 分鐘後重試                                       |
| **Content policy violation**              | 提示詞違反內容政策             | 修改提示詞，避免敏感內容                                |
| **Network timeout**                       | Chrome 或 ChatGPT 伺服器無響應 | 檢查網路連線，重試                                      |

---

## 📊 Testing Checklist

### Unit Tests (後端)

```bash
# 執行所有測試
pnpm test

# 執行特定測試檔案
pnpm --filter @open-design/daemon test
```

**預期測試覆蓋：**

- [ ] `renderChatGPTWebImage()` 成功情境
- [ ] 各種錯誤診斷（selecter stale、login expired、rate limit 等）
- [ ] 錯誤訊息格式驗證

### Integration Test (完整流程)

**Test Case 1: 成功生成**

```bash
# 執行步驟
1. 在 Workbench 選擇「宇宙太空站」範本
2. 點擊「傳送到 ChatGPT」
3. 等待 20 秒

# 預期結果
✓ 顯示生成的圖片縮圖
✓ 檔案自動下載到 ~/Downloads
✓ 訊息顯示「✅ 已下載至本機」
```

**Test Case 2: Chrome 未啟動**

```bash
# 執行步驟
1. 關閉所有 Chrome 視窗
2. 在 Workbench 點擊「傳送到 ChatGPT」

# 預期結果
✓ 顯示錯誤：「Chrome 遠程調試連線失敗」
✓ 建議在 Terminal 執行啟動命令
```

**Test Case 3: ChatGPT 未登入**

```bash
# 執行步驟
1. Chrome 中登出 ChatGPT
2. 在 Workbench 點擊「傳送到 ChatGPT」

# 預期結果
✓ 顯示錯誤：「ChatGPT login expired or 2FA required」
✓ 提示在 Chrome 中重新登入
```

**Test Case 4: 無效提示詞**

```bash
# 執行步驟
1. 進入 gallery 模式，選擇「不適當內容」的提示詞
2. 點擊「傳送到 ChatGPT」

# 預期結果
✓ 顯示錯誤：「Content policy violation」
```

---

## 🛠️ Troubleshooting Guide

### 問題 1: Chrome 連線失敗

**症狀：** 錯誤訊息「Chrome 遠程調試連線失敗」

**診斷：**

```bash
# 檢查 Chrome 是否在監聽 port 9000
lsof -i :9000
# 應顯示: Google Chrome ... TCP LISTEN

# 手動測試 CDP 連線
curl http://localhost:9000/json/version
# 應返回 JSON，包含 Chrome 版本資訊
```

**解決方案：**

1. 確認 Chrome 啟動命令完整：
   ```bash
   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
     --remote-debugging-port=9000 \
     --user-data-dir=/tmp/chrome-profile-copy \
     --profile-directory=Default
   ```
2. 檢查是否有防火牆或其他程式佔用 port 9000：
   ```bash
   sudo lsof -i :9000
   ```
3. 若有其他程式，改用不同 port（例如 9001）並更新 `media.ts` 中的 `cdpUrl`

---

### 問題 2: 登入過期

**症狀：** 錯誤訊息「ChatGPT login expired or 2FA required」

**診斷：**

1. 手動進入 https://chatgpt.com（在 Chrome 中）
2. 檢查是否被要求登入或二次驗證

**解決方案：**

1. 在 Chrome 中完成登入/驗證
2. 關閉 Chrome 視窗：
   ```bash
   pkill -f "Google Chrome"
   ```
3. 重新啟動 Chrome（profile 會記住新的登入狀態）：
   ```bash
   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
     --remote-debugging-port=9000 \
     --user-data-dir=/tmp/chrome-profile-copy \
     --profile-directory=Default
   ```

---

### 問題 3: DALL-E 無權限

**症狀：** 錯誤訊息「Access denied — your account may not have DALL-E access」

**原因：** ChatGPT Plus 訂閱已過期或帳號無 DALL-E 權限

**解決方案：**

1. 在 https://chatgpt.com 中檢查訂閱狀態
2. 若無 Plus，升級訂閱
3. 若已有 Plus，聯繫 OpenAI 支援

---

### 問題 4: OpenCLI 選擇器失效

**症狀：** 錯誤訊息「ChatGPT UI element not found (Composer selector stale)」

**原因：** ChatGPT UI 已更新，OpenCLI 中的 CSS 選擇器失效

**解決方案：**

1. 檢查 OpenCLI 是否有新版本：
   ```bash
   which opencli
   opencli --version
   ```
2. 若有新版本，更新並重試
3. 若問題持續，聯繫 OpenCLI 開發者報告選擇器變更

---

### 問題 5: 生成超時

**症狀：** 等待 30 秒+ 無回應，最後顯示超時錯誤

**診斷：**

1. 檢查網路連線：
   ```bash
   ping chatgpt.com
   ```
2. 在 Chrome 中手動測試 DALL-E 生成（確認功能正常）

**解決方案：**

1. 檢查網路連線和 ChatGPT 伺服器狀態
2. 簡化提示詞（長提示詞生成較慢）
3. 重試（伺服器可能暫時負載過高）

---

## 📝 API Response Format Reference

### 成功回應

```json
{
  "success": true,
  "status": "success",
  "imageBase64": "iVBORw0KGgoAAAANSUhEUgA...",
  "ext": "png",
  "providerNote": "Generated via ChatGPT Web DALL-E"
}
```

### 錯誤回應

```json
{
  "error": {
    "code": "GENERATION_FAILED",
    "message": "Chrome remote debugging connection failed — check if Chrome is running on port 9000"
  }
}
```

**前端處理邏輯：**

```javascript
const data = await response.json();
if (data.status === "success") {
  // 成功：顯示圖片
  setGenResult({ base64: data.imageBase64, ext: data.ext });
} else {
  // 失敗：顯示錯誤訊息（自動提取 data.error.message）
  setGenError(data.error?.message || "未知錯誤");
}
```

---

## ✅ Verification Criteria

| 項目               | 標準                                     | 狀態 |
| ------------------ | ---------------------------------------- | ---- |
| **Chrome 連線**    | 能連接到 CDP port 9000                   | ⬜   |
| **ChatGPT 登入**   | 帳號已登入且無 2FA 提示                  | ⬜   |
| **OpenCLI 二進制** | 存在於 PATH 中且可執行                   | ⬜   |
| **後端 API**       | `/api/garden/gpt-image2/generate` 可呼叫 | ⬜   |
| **前端 UI**        | Workbench 頁面可訪問                     | ⬜   |
| **成功生成**       | 1 次圖片成功生成並下載                   | ⬜   |
| **錯誤診斷**       | 至少 1 個錯誤情境顯示詳細訊息            | ⬜   |
| **Type Check**     | `pnpm typecheck` 通過                    | ⬜   |
| **Tests**          | `pnpm test` 通過                         | ⬜   |

---

## 📌 Quick Command Reference

```bash
# 一鍵啟動全部服務
Terminal 1:
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9000 \
  --user-data-dir=/tmp/chrome-profile-copy \
  --profile-directory=Default

Terminal 2:
cd /Users/christianwu/open-design && pnpm tools-dev start web

Terminal 3:
# 開啟瀏覽器
open http://localhost:17573/tools/gpt-image2/workbench

# 監看日誌（可選）
tail -f /tmp/dev.log | grep -E "GENERATION_FAILED|Diagnostics|ERROR"
```

---

## 🔗 Related Files

| 檔案                                                             | 目的                        |
| ---------------------------------------------------------------- | --------------------------- |
| `apps/daemon/src/media.ts`                                       | 後端圖片生成邏輯 & 錯誤診斷 |
| `apps/daemon/src/server.ts`                                      | API 端點定義 & 回應序列化   |
| `apps/web/src/garden/gpt-image2/components/skills/Workbench.tsx` | 前端 UI & 錯誤顯示          |
| `apps/web/src/garden/gpt-image2/data/cases.json`                 | 範本和圖片庫資料            |

---

## 🎓 Next Steps

1. **執行完整測試** — 按照上方 Setup Steps 逐步執行
2. **收集反饋** — 記錄任何錯誤訊息或異常行為
3. **優化診斷** — 根據實際測試補充更多錯誤模式
4. **文件更新** — 更新本計劃中的注意事項或新發現的陷阱
