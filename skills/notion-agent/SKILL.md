---
name: opencli-notion
description: |
  AI Agent 完整操控 Notion Desktop App 的專家技能。讓 Claude 使用確定性、本地 CLI 方式操控 Notion（讀、寫、搜尋、新建、匯出等），無需瀏覽器手動操作。

  **何時使用**：
  - 用戶提及 Notion 或要求在 Notion 中讀寫內容
  - 需要搜尋特定 Notion 頁面
  - 要批量建立或更新頁面
  - 需要匯出 Notion 內容為 Markdown
  - 自動化 Notion 工作流程

compatibility:
  required:
    - "OpenCLI Notion Adapter（clis/notion/）"
    - "Notion Desktop App 啟動於 CDP mode"
  tools:
    - "Bash"
    - "NodeJS（OpenCLI runtime）"
---

# OpenCLI Notion — 完整 AI Agent Skill

**目標**：讓 AI Agent 使用確定性、本地 CLI 方式完整操控 Notion Desktop App，零 LLM token，高效且穩定。

---

## 📋 前置條件（Agent 啟動前必執行）

> **重要**：所有 Notion 操作前，必須先確保以下環境已正確配置。

### 1. 以 CDP 模式啟動 Notion（推薦 port 9230，備選 9222）

```bash
# 主推薦：port 9230
/Applications/Notion.app/Contents/MacOS/Notion --remote-debugging-port=9230

# 備選：若 9230 無法使用，嘗試 port 9222
/Applications/Notion.app/Contents/MacOS/Notion --remote-debugging-port=9222
```

**說明**：Chrome DevTools Protocol 模式讓 OpenCLI 以程式化方式控制 Notion。

### 2. 設定環境變數

建議加到 `~/.zshrc` 或 Agent 的持久 shell 環境：

```bash
# 主推薦：使用 port 9230
export OPENCLI_CDP_ENDPOINT="http://127.0.0.1:9230"

# 備選：若 9230 無法使用，改為 port 9222
# export OPENCLI_CDP_ENDPOINT="http://127.0.0.1:9222"
```

### 3. 驗證連線狀態

Agent 啟動時必執行：

```bash
opencli notion status
```

預期輸出：

```
✅ CDP 連線正常
目前頁面：[頁面標題]
URL: [頁面 URL]
```

**失敗排除**：

- 若顯示 CDP 連線失敗 → 確認 Notion 已用 `--remote-debugging-port` 啟動（9230 或 9222）
- 若無法連線到 127.0.0.1:9230 → 檢查防火牆或使用 `lsof -i :9230` 驗證 port
- 若 9230 被佔用 → 嘗試備選 port 9222，改為 `export OPENCLI_CDP_ENDPOINT="http://127.0.0.1:9222"`

---

## 🎯 核心命令總覽（Agent 常用指令集）

| 任務              | 指令                                           | 描述                    | Agent 使用場景              |
| ----------------- | ---------------------------------------------- | ----------------------- | --------------------------- |
| **狀態檢查**      | `opencli notion status`                        | 檢查 CDP 連線與目前頁面 | 每次操作前必跑              |
| **全域搜尋**      | `opencli notion search "關鍵字"`               | 模擬 Cmd+P / Quick Find | "在 Notion 搜尋 XXX"        |
| **讀取目前頁面**  | `opencli notion read`                          | 取得目前頁面標題與內容  | "讀取當前 Notion 頁面內容"  |
| **追加文字**      | `opencli notion write "文字內容"`              | 在頁面底部追加內容      | "在目前頁面追加以下內容..." |
| **新建頁面**      | `opencli notion new "頁面標題"`                | 模擬 Cmd+N 新建頁面     | "新建名為 XXX 的頁面"       |
| **側邊欄列表**    | `opencli notion sidebar`                       | 列出側邊欄所有項目      | "顯示 Notion 側邊欄"        |
| **最愛頁面**      | `opencli notion favorites`                     | 列出 Favorites / 收藏   | "列出我的最愛頁面"          |
| **匯出 Markdown** | `opencli notion export [--output 路徑]`        | 匯出目前頁面為 MD       | "把目前頁面匯出成 Markdown" |
| **插入區塊**      | `opencli notion append-block <type> [content]` | 在頁面底部插入新區塊    | "在目前頁面末尾新增段落..." |
| **切換代辦項**    | `opencli notion toggle-todo [index]`           | 切換代辦項完成狀態      | "完成第 X 個任務"           |
| **查詢資料庫**    | `opencli notion database-query [filter]`       | 查詢頁面資料庫記錄      | "列出當前頁面的資料庫"      |

---

## 📖 Agent 操作標準流程（SOP）

```
1. 初始化驗證 → opencli notion status
2. 定位目標頁面 → opencli notion search "..." 或讓使用者手動打開
3. 讀取頁面內容 → opencli notion read
4. 寫入/修改內容 → opencli notion write "..."
5. 驗證修改結果 → 再次 opencli notion read
6. 備份或匯出 → opencli notion export --output ./backup/
```

### 範例執行

**使用者請求**：「幫我在 Notion 新建一個頁面『2026 Q3 產品規劃』，並寫入大綱。」

**Agent 執行步驟**：

```bash
# 1. 驗證連線
opencli notion status

# 2. 新建頁面
opencli notion new "2026 Q3 產品規劃"

# 3. 追加內容
opencli notion write "## 目標
- 市場調研
- 功能優先化

## 關鍵里程碑
- Q3 初期：需求評估
- Q3 中期：設計完成
- Q3 末期：beta 發佈"

# 4. 驗證
opencli notion read
```

---

## 🤖 System Prompt（給 Agent 直接使用）

```markdown
你是我的 Notion 操作專家。所有 Notion 操作**必須**透過 opencli notion 系列指令完成。

## 可用指令清單

- `opencli notion status` → 檢查 CDP 連線與目前頁面
- `opencli notion search "query"` → 全域搜尋 Notion 頁面
- `opencli notion read` → 讀取目前頁面的標題與內容
- `opencli notion write "text"` → 在頁面底部追加文字內容
- `opencli notion new "title"` → 新建頁面
- `opencli notion export [--output path]` → 匯出目前頁面為 Markdown
- `opencli notion favorites` → 列出收藏的頁面
- `opencli notion sidebar` → 列出側邊欄結構
- `opencli notion append-block "type" "content"` → 在頁面底部插入新區塊（type: text, h1, h2, h3, code, ul, ol, quote, toggle, divider）
- `opencli notion toggle-todo [index]` → 切換代辦項完成狀態（不指定 index 則切換所有項目）
- `opencli notion database-query [filter]` → 查詢目前頁面的資料庫記錄（可選過濾條件）

## 操作準則

1. **操作前必驗證**：先執行 `status` 確認連線正常
2. **輸出指令時**：用 code block 包裝，先說明將執行的動作
3. **等待使用者確認**：大型操作（如新建、大量修改）需先徵詢使用者意見
4. **錯誤處理**：若指令失敗，嘗試診斷原因並提供排除方案

## 工作流範例

- 搜尋 → 讀取 → 分析 → 寫入 → 驗證 → 備份
```

---

## 🔧 進階技巧（Agent 進階能力）

### 組合指令

```bash
# 讀取後立即寫入
opencli notion read && opencli notion write "新增會議記錄..."

# 導出多個備份
opencli notion export --output ~/backups/page-$(date +%Y%m%d).md
```

### 搭配 browser 原語（精準 UI 控制）

當 CLI 無法直接實現時，可輔助 browser 指令：

```bash
opencli browser eval "document.querySelector('[data-testid=\"add-button\"]').click()"
```

### 批量操作工作流

結合 `favorites` + `search` 實現掃描與批量更新：

```bash
# 1. 列出最愛頁面
opencli notion favorites

# 2. 逐頁讀取並更新
for page in $(opencli notion favorites | jq -r '.[] | .id'); do
  opencli notion read
  # 執行需要的處理...
done
```

---

## ⚠️ 常見錯誤處理（Agent 必須掌握）

| 錯誤現象                 | 原因                                           | 解決方案                                                                                                    |
| ------------------------ | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **CDP 連線失敗**         | Notion 未以 `--remote-debugging-port` 模式啟動 | 確認 Notion 使用正確指令啟動：`/Applications/Notion.app/Contents/MacOS/Notion --remote-debugging-port=9230` |
| **找不到 editable 區域** | 目前頁面焦點不在編輯區                         | 先執行 `read` 確認頁面加載，再嘗試 `write`                                                                  |
| **搜尋結果不準確**       | 搜尋索引未更新或關鍵字過於相似                 | 增加等待時間或改用更具體的搜尋詞                                                                            |
| **匯出內容不完整**       | 頁面含有未展開的 toggle / collapsed 區塊       | 建議手動展開所有區塊後再執行 `export`                                                                       |
| **timeout 錯誤**         | 頁面加載過慢或內容過大                         | 減少頁面複雜度或分段操作                                                                                    |
| **連接埠被佔用（9230）** | Notion 或其他進程佔用 port 9230                | 改用備選端口：`export OPENCLI_CDP_ENDPOINT="http://127.0.0.1:9222"` 後重試，或檢查 `lsof -i :9230`          |
| **9222 端口也不可用**    | 兩個推薦端口都被佔用                           | 使用 `lsof -i :9222` 檢查占用，或更換不同端口後重新啟動 Notion 應用程式                                     |

---

## 📚 參考資源

- **CLI 實作**：`clis/notion/` 目錄下的各指令模組
- **詳細指南**：見 `references/notion-cli-guide.md`
- **驗證工具**：執行 `scripts/verify-notion-cli.sh` 檢查環境

---

## ✅ 操作檢查清單

使用此技能前，請確認：

- [ ] Notion Desktop App 已用 `--remote-debugging-port=9230` 啟動
- [ ] 環境變數 `OPENCLI_CDP_ENDPOINT` 已設定為 `http://127.0.0.1:9230`
- [ ] 執行 `opencli notion status` 顯示連線正常
- [ ] OpenCLI 已安裝且 `clis/notion/` 目錄完整
- [ ] 可訪問目標 Notion 工作區（帳戶已登入）
