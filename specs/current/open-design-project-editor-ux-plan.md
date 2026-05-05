# Open Design Project Editor UX Plan

## Scope
本計畫回應專案檔案頁面的四個備注，目標是讓 Open Design 的專案工作區更接近 Claude Design / Stitch 的「看得到、點得到、可修改」體驗。

目標頁面：`/projects/:projectId/files/:fileName`

## Priorities

1. 修復 CLI / Agent 歷史對話展示
2. 明確化並啟用 `調整` / `編輯` 的使用者心智模型
3. 建立可從目前專案檔案萃取的元件 Gallery
4. 支援元件從 Gallery 進入提示詞流程，並預留拖放到畫布後的輔助提示詞流程

## Comment 1: CLI / Agent 歷史對話展示

### 問題
目前歷史對話中可能只顯示角色與時間，例如 `Codex 1 天前`，但訊息內容空白。原因通常是舊訊息或 daemon run 只持久化 `message.content`，而新版 Assistant UI 主要從 `message.events` 組裝 blocks。當 `events` 為空時，畫面沒有 fallback。

### 第一版修正
- `AssistantMessage` 在 `events` 無可渲染文字時，回退渲染 `message.content`。
- 若同時存在 `events` 與 `content`，仍以 events 為主，避免 streaming 中重複渲染。
- 保留工具卡、thinking、usage 等新版事件流渲染。

### 驗收
- 舊 conversation 載入後至少能看到 assistant 文字內容。
- 新 streaming run 不重複顯示同一段文字。

## Comment 2: 編輯功能

### UX 定義
`編輯` 是針對目前 preview 畫面中某個 DOM 元素提出「內容或局部結構修改」的入口。它不是直接在 iframe 裡永久改 DOM，而是產生一個高品質修改指令交給目前 Open Design agent，使變更能反映回 repo/project file。

### 使用者流程
1. 使用者點擊 toolbar 的 `編輯`。
2. Preview 進入可選取狀態。
3. 使用者點擊畫面中的文字或區塊。
4. 小彈窗顯示目前元素資訊：selector、目前文字、HTML hint。
5. 使用者輸入要修改的文字或設計意圖。
6. 系統送出包含 target context 的 prompt 給目前 agent。
7. Agent 修改目前開啟的 HTML / CSS / 相關檔案。

### 第一版落地
- 將 `編輯` 按鈕從 disabled 改為 active。
- 第一版重用 comment bridge 的 DOM target snapshot，不新增一套 selector 抽取邏輯。
- 編輯送出的 prompt 走既有 `onSend`，讓修改由目前 selected CLI/API agent 執行。

### 後續強化
- 加入 inline text replacement diff preview。
- 支援 contenteditable 暫存，按 Enter 送 agent patch。
- 對 HTML 做 AST patch，減少 agent 搜尋成本。

## Comment 3: 調整功能

### UX 定義
`調整` 是全頁級或多元素級的設計調校入口，負責把使用者的模糊意圖轉成可執行的設計變更 brief。

適合任務：
- 調整整體視覺層級、字體大小、留白、色彩、版面密度
- 將目前 slide/page 改成另一種風格
- 批次統一 card、button、heading、footer
- 修正 deck 對齊、overflow、可讀性

不適合任務：
- 單一元素文字替換，應用 `編輯`
- 手繪標註與箭頭，應用 `繪製`
- 只留下評論，應用 `評論`

### 使用者流程
1. 使用者開啟 `調整`。
2. 系統顯示調整面板，提供常用任務 chips。
3. 使用者輸入修改方向，例如「讓這頁更像投資人簡報，降低文字密度」。
4. 系統把目前檔案、目前 slide/page、可見 DOM 摘要與使用者意圖組成 prompt。
5. 送給目前 agent 修改當前專案檔案。

### 第一版落地
- 將 disabled toggle 改成可點擊面板。
- 面板說明 `調整` 與 `編輯`、`評論`、`繪製` 的差異。
- 提供可一鍵送出的調整 chips。

## Comment 4: 元件 Gallery / 匯入

### UX 定義
`匯入 -> 元件 Gallery` 讓使用者把目前專案已產出的 HTML / React / CSS / Markdown 區塊作為可重用元件來源。它不是靜態素材庫，而是「帶提示詞的 reuse brief」。

### 使用者流程 A: 點擊新增
1. 使用者點擊 `匯入`。
2. 選擇 `目前專案元件 Gallery`。
3. Gallery 顯示目前專案中可重用的 HTML / React / CSS / Markdown / image 檔案。
4. 使用者點擊某元件。
5. 彈窗要求輸入用途備注或輔助提示詞。
6. 系統把 `@file` attachment 與用途 brief 加入 composer draft。
7. 使用者可再補充後送出。

### 使用者流程 B: 拖放到畫布
1. 使用者從 Gallery 拖曳元件到 preview canvas。
2. 放開後系統彈窗詢問「想將此元件做什麼用？」。
3. 未輸入輔助提示詞前不送出。
4. 輸入後系統送出 agent prompt，要求把元件整合到當前檔案/slide/區域。

### 第一版落地
- 在 composer import menu 加入 `目前專案元件 Gallery`。
- Gallery 從 `projectFiles` 萃取候選：HTML、code、text、image、sketch。
- 點擊候選會要求用途備注，並把 prompt 插入 composer。
- 元件項目設為 draggable，資料格式預留 `application/x-open-design-component`。
- File viewer 先支援 drop event prompt，實際寫入仍交給 agent。

## Implementation Sequence

1. 新增此計畫文件。
2. 修復 AssistantMessage fallback，讓歷史對話可見。
3. 啟用 `調整` 面板與 `編輯` prompt flow。
4. 擴充 ChatComposer import panel，加入元件 Gallery 與用途備注。
5. 將 component drop prompt 往上接到 ProjectView 的 `handleSend`。
6. 執行 web typecheck；若既有未完成 Thesys/其他變更造成失敗，記錄非本任務阻塞。

## Non-goals for First Version

- 不直接做 HTML AST 自動 patch。
- 不直接把拖放位置轉成絕對 DOM 插入。
- 不做跨專案元件搜尋；先以目前專案檔案為來源。
- 不實作 GitHub / website 外部搜尋。
