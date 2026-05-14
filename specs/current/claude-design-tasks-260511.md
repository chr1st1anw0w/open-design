---
title: "Claude Design 開發任務清單"
type: plan
created: 2026-05-11
updated: 2026-05-11
design-base: design-systems/Skywalker/
roadmap: specs/DEVELOPMENT-ROADMAP-260511.md
---

# Claude Design 開發任務清單

> **前提**：Skywalk Design System 已存在，所有任務直接基於現有設計系統延伸，無需重新定義樣式。  
> **原則**：依「Claude Design 最擅長 × token 消耗最少 × 開發價值最高」排序。

---

## Claude Design 能力邊界

| 擅長（優先交辦） | 不擅長（不要交辦） |
|---|---|
| 元件變體與狀態設計 | 複雜互動邏輯 |
| 新畫面的版型配置 | 真實 API 整合 |
| 空狀態、錯誤狀態設計 | 動態資料處理 |
| 元件命名與 Auto Layout | 後端服務架構 |
| 現有元件的延伸變體 | 複雜動畫序列 |

---

## 任務執行順序總覽

| 順序 | 任務 | 對應功能 | Token 消耗 | 產出價值 |
|------|------|----------|-----------|--------|
| 1 | ConversationSearch Modal | F1 | 低 | 中 |
| 2 | ProjectCard 缺失狀態補完 | 現有元件 | 極低 | 高 |
| 3 | DiffView 元件 | F6 | 低 | 高 |
| 4 | ArtifactTimeline 元件 | F2 | 低 | 中 |
| 5 | AIAssistantPanel 外殼 | F8 | 中 | 極高 |

> 任務 1 與任務 2 可合併在同一次對話執行，進一步節省 token。

---

## 任務 1 — ConversationSearch 搜尋框（F1）

> 最簡單、最獨立、最省 token，先做這個暖機。

**提示詞：**

```
基於現有 Skywalk design system，設計 ConversationSearch 元件。

這是一個 Cmd+K 觸發的全局搜尋 Modal。

需要設計的狀態：
1. 空狀態（剛開啟，輸入框為空）
2. 搜尋中（顯示 skeleton 佔位列）
3. 有結果（顯示對話列表，每列包含：時間戳 + 訊息摘要 + 專案標籤）
4. 無結果（顯示 empty state）

元件規格：
- 寬度：640px，水平置中
- 最大高度：480px，超出內部捲動
- 輸入框：自動聚焦，使用 Skywalk monospace 字型
- 結果列：關鍵字以 Skywalk 主色高亮
- 背景：深色遮罩層

元件命名：conversation-search / search-result-row / search-empty-state
不需要設計動畫，只需靜態狀態。
```

---

## 任務 2 — ProjectCard 缺失狀態補完（現有元件）

> 不是新元件，只補完現有 ProjectCard 缺失的狀態，幾乎不消耗 token。

**提示詞：**

```
基於現有 Skywalk design system 的 ProjectCard 元件，補完以下缺少的狀態：

1. Loading 狀態（skeleton 版本，保持原本卡片尺寸比例）
2. Locked 狀態（表示此專案為 source-backed，顯示鎖定圖示 + 半透明遮罩）
3. Error 狀態（載入失敗，顯示 retry 按鈕）
4. Selected 狀態（用於多選操作時的選中樣式）

規則：
- 嚴格沿用現有 ProjectCard 的尺寸、排版、圓角、間距
- 只新增狀態差異，不改變基礎結構
- 各狀態需標註對應的 CSS class 名稱或 data-state 值
```

---

## 任務 3 — DiffView 元件（F6 Manual Edit Mode）

> 程式碼骨架已存在於 apps/web/src/edit-mode/，只需 UI 定義。

**提示詞：**

```
基於現有 Skywalk design system，設計 DiffView 元件。

用途：顯示 AI 生成版本 vs 使用者手動修改版本的差異對比。

版型：左右分割，各佔 50%

左欄（AI 版本）：
- 頂部標籤：「AI 生成」
- 被刪除的行：整行背景以紅色低飽和度標示

右欄（手動版本）：
- 頂部標籤：「手動覆蓋」
- 新增的行：整行背景以 Skywalk 主色低飽和度標示

頂部操作列（三個按鈕）：
- 採用 AI 版本
- 採用手動版本
- 合併

狀態設計（共三種）：
1. 正常（無衝突）：兩欄正常顯示
2. 衝突（有差異）：衝突行高亮，頂部顯示警告 badge
3. 鎖定（source-backed）：整個元件顯示鎖定提示，操作列 disabled

元件命名：diff-view / diff-line / diff-toolbar
不需要設計行號計算邏輯，只需視覺樣式。
```

---

## 任務 4 — ArtifactTimeline 元件（F2）

> 視覺結構固定，Claude Design 最擅長這類時間軸元件。

**提示詞：**

```
基於現有 Skywalk design system，設計 ArtifactTimeline 元件。

用途：顯示一個 Artifact 的版本快照歷史，支援回溯。

結構：
- 垂直時間軸，左側有連接線
- 每個節點：版本標示 + 時間戳 + 變更摘要（最多 60 字）

節點狀態（同一個節點，三種樣式）：
1. 目前版本（最新）：實心節點 + 「目前版本」標籤
2. 歷史版本：空心節點 + 時間戳（較暗）
3. Hover 狀態：顯示縮圖預覽（120×80px 預留框）+ 「還原此版本」按鈕

限制：
- 最多顯示 8 個節點
- 超出顯示「查看全部」連結

元件命名：artifact-timeline / timeline-node / timeline-restore-button
```

---

## 任務 5 — AIAssistantPanel 外殼（F8）

> 最後做，token 消耗最多，但是 Portfolio 核心差異化功能起點。只設計靜態外殼，不做邏輯。

**提示詞：**

```
基於現有 Skywalk design system，設計 AIAssistantPanel 的靜態外殼。

重要：只設計畫面外殼與空狀態，不需要設計對話邏輯或動態互動。

版型：右側固定抽屜，寬 400px，全螢幕高度

區塊（由上到下）：
1. 頂部標題列：「AI Assistant」文字 + 模型標籤 badge（文字："C1"）+ 關閉按鈕
2. Prompt Chips 列：水平排列，可捲動，6 個固定建議問題（如下）
3. 對話訊息區：可捲動，預留內容空間（設計一個 AI 回覆 + 一個使用者訊息的示例）
4. 底部輸入列：文字輸入框 + 送出按鈕，固定於底部

Prompt Chips 內容（6 個）：
- Christian 最擅長什麼？
- 展示 Web3 介面作品
- AI 工作流程說明
- 哪個作品展現設計系統能力？
- 他能替新創公司做什麼？
- 查看所有案例

AI 回覆訊息樣式：
- 使用左側 4px 邊框的矩形區塊（非氣泡）
- 不使用通用聊天氣泡樣式

使用者訊息樣式：
- 右對齊，使用 Skywalk 次要背景色

元件命名：ai-assistant-panel / prompt-chip / message-block / prompt-composer
只需靜態畫面，不需要設計串流回覆或動畫狀態。
```

---

*Claude Code 生成 — 2026-05-11*
