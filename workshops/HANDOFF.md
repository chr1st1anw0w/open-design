# Open Design Handoff: AI Workflow Workshop Deck

> 目的：讓下一個 agent 快速接手 `workshops/`，理解簡報目的、標準、資料夾架構、階段文件與可直接使用的提示詞。  
> 工作原則：先讀文件，確認階段，再修改對應檔案；不要從零開始重做內容架構。

## 1. 專案目的

本專案要把兩份 Notion 匯出的 Markdown 整併為一套完整、漂亮、可授課的企業 AI Workflow Workshop HTML Deck。

目標不是單純做 18 頁簡報，而是建立一份內容完整、圖文豐富、可加入動態圖表、照片、短影片與講者備註的 Open Design 簡報包。

核心課程主張：

> AI 不是直接吃最終文件，而是處理乾淨、結構化、可切分的中間資料；企業要先升級文件格式、協作流程與知識庫，再談 RAG、Harness、Agentic 與 ERP/AI SOP。

## 2. 主要路徑

| 類型 | 路徑 | 說明 |
| --- | --- | --- |
| 工作目錄 | `workshops/` | 主要交付目錄 |
| 來源母本 | `workshops/source/notion-master.md` | Workshop 定位、教學策略、課程內容、系統建議 |
| 來源規格 | `workshops/source/notion-spec.md` | 原始 18 頁提示詞、逐頁演講稿、視覺呈現建議 |
| 人類審閱主檔 | `workshops/master-content.md` | 目前最重要的內容總稿與教課備忘 |
| 設計標準 | `workshops/DESIGN.md` | 待更新為 Cobalt Cartesian 混合風格 |
| Deck contract | `workshops/DECK.md` | 待依 `master-content.md` 更新為實作規格 |
| 最終 HTML | `workshops/index.html` | 目前仍是舊版，後續需改為 reveal.js 5.x |
| 接手文件 | `workshops/HANDOFF.md` | 本文件 |

## 3. 目前狀態

已完成：

| 項目 | 狀態 |
| --- | --- |
| 來源規格檔正規化為 `source/notion-spec.md` | 完成 |
| `master-content.md` 建立為 35 頁內容總稿 | 完成 |
| 每頁素材放置索引 | 完成 |
| 圖片 / 圖表中英提示詞清單 | 完成 |
| README 改為內容審閱流程 | 完成 |

尚未完成：

| 項目 | 下一步 |
| --- | --- |
| `Plan.md` | 依本 handoff 建立正式實作計畫與 prompt |
| `DESIGN.md` | 從舊 helix 規格改為 Cobalt Cartesian 混合設計系統 |
| `DECK.md` | 從舊 18 頁空白節奏稿改成 35 頁 deck contract |
| `index.html` | 從舊 replit-deck/helix 改成 reveal.js 5.x |
| 圖片 / 截圖 / 錄影素材 | 後續 asset pass 補齊 |

## 4. 設計方向

參考 skill：

| Skill | 用途 |
| --- | --- |
| `skills/html-effectiveness` | Markdown 轉 HTML 的資訊架構方法 |
| `skills/html-ppt-zhangzara-cobalt-grid` | 鈷藍格線、研究報告感、hairline、editorial table |
| `skills/html-ppt-zhangzara-cartesian` | 暖中性色、顧問感、安靜成熟的留白節奏 |

字體策略：

| 文字類型 | 規則 |
| --- | --- |
| 中文主體 | Sans 為主，優先 `Noto Sans TC` |
| 內文與表格 | Sans，保持投影可讀 |
| 程式碼 / metadata | `JetBrains Mono` 或 monospace |
| Serif / italic | 只用於英文裝飾詞、章節編號、引用 emphasis |

視覺語彙：

| 元素 | 規則 |
| --- | --- |
| 背景 | warm paper / off-white |
| 主色 | cobalt blue |
| 輔助 | muted stone / charcoal |
| Progress | 1px orange bottom progress bar |
| 圖表 | editorial table、compare split、matrix、timeline、roadmap、pyramid、code frame |
| 動畫 | reveal fragments、animated bars、step reveal、roadmap progression；需支援 reduced-motion |

## 5. 階段流程與要提供的文件

### Stage 1: 內容審閱與調整

提供給 agent：

| 文件 | 用途 |
| --- | --- |
| `workshops/master-content.md` | 主內容、每頁目的、備忘、素材需求 |
| `workshops/source/notion-master.md` | 內容補強依據 |
| `workshops/source/notion-spec.md` | 原始頁次、演講稿、視覺建議依據 |

提示詞：

```text
請只審閱 `workshops/master-content.md` 的頁面順序、內容密度、授課邏輯與素材需求。
不要修改 HTML。若內容有缺漏，請直接提出應新增/合併/拆分的頁面與理由。
需要引用來源時，優先看 `workshops/source/notion-spec.md`，再用 `workshops/source/notion-master.md` 補強。
```

### Stage 2: 建立實作規格

提供給 agent：

| 文件 | 用途 |
| --- | --- |
| `workshops/master-content.md` | 內容主線 |
| `workshops/HANDOFF.md` | 接手規則 |
| `skills/html-ppt-zhangzara-cobalt-grid/SKILL.md` | 視覺參考 |
| `skills/html-ppt-zhangzara-cartesian/SKILL.md` | 視覺參考 |
| `skills/html-effectiveness/SKILL.MD` | HTML output 原則 |

提示詞：

```text
請根據 `workshops/master-content.md` 與 `workshops/HANDOFF.md` 建立或更新 `workshops/Plan.md`。
`Plan.md` 要是下一階段實作 reveal.js deck 的唯一規格入口。
內容需包含：source precedence、35 頁 deck contract、reveal.js 技術規格、layout component、speaker notes、Mermaid handoff、圖片/截圖/錄影素材策略、測試清單。
不要生成 `index.html`。
```

### Stage 3: 設計標準更新

提供給 agent：

| 文件 | 用途 |
| --- | --- |
| `workshops/HANDOFF.md` | 設計決策 |
| `skills/html-ppt-zhangzara-cobalt-grid/example.html` | 鈷藍格線與版面語彙 |
| `skills/html-ppt-zhangzara-cartesian/example.html` | 暖中性色與顧問感 |
| `workshops/master-content.md` | 實際內容密度 |

提示詞：

```text
請更新 `workshops/DESIGN.md` 為 Cobalt Cartesian Workshop System。
中文主體保持 sans，serif/italic 僅限英文裝飾詞與局部 emphasis。
設計標準需包含：color tokens、typography、spacing、layout vocabulary、table/matrix/compare/roadmap/pyramid/code-frame 規格、motion、anti-patterns。
不要修改 `index.html`。
```

### Stage 4: Deck contract 更新

提供給 agent：

| 文件 | 用途 |
| --- | --- |
| `workshops/master-content.md` | 每頁內容與素材 |
| `workshops/DESIGN.md` | 視覺標準 |
| `workshops/Plan.md` | 實作規格 |

提示詞：

```text
請把 `workshops/DECK.md` 更新為 35 頁 deck contract。
每頁需包含：頁碼、H1/H2/H3、layout、畫面元素、speaker notes、時間、圖片/圖表/影片素材 ID、Mermaid/diagram handoff、是否需要 fragment 動畫。
內容以 `workshops/master-content.md` 為準，不新增來源沒有的數字或案例。
不要修改 `index.html`。
```

### Stage 5: reveal.js HTML 實作

提供給 agent：

| 文件 | 用途 |
| --- | --- |
| `workshops/Plan.md` | 技術規格 |
| `workshops/DESIGN.md` | 設計標準 |
| `workshops/DECK.md` | 逐頁 contract |
| `workshops/master-content.md` | 講稿與素材備忘 |

提示詞：

```text
請實作 `workshops/index.html` 為 reveal.js 5.x 單檔 HTML deck。
CSS inline；JS 可用 CDN：reveal.js、RevealNotes、mermaid。
頁面依 `workshops/DECK.md`，內容依 `workshops/master-content.md`。
需支援：方向鍵、Esc overview、speaker notes、右下角 X / total、底部 1px orange progress bar、Mermaid render、prefers-reduced-motion。
不要把圖片 prompt 寫成畫面主文；prompt 只保留在註解或素材 metadata。
```

### Stage 6: 素材生成與替換

提供給 agent：

| 文件 | 用途 |
| --- | --- |
| `workshops/master-content.md` | 圖片/圖表中英提示詞與素材 ID |
| `workshops/index.html` | placeholder 替換位置 |

提示詞：

```text
請依 `workshops/master-content.md` 的「圖片 / 圖表生成提示詞」與素材 ID 逐步生成或整理素材。
每個素材需輸出：asset id、頁面、檔名、中文提示詞、英文提示詞、使用位置、替換狀態。
生成後只替換對應 placeholder，不改動頁面內容與設計系統。
```

### Stage 7: QA 與演練

提供給 agent：

| 文件 | 用途 |
| --- | --- |
| `workshops/index.html` | 實際檢查 |
| `workshops/master-content.md` | 講稿與控時 |
| `workshops/DECK.md` | 頁面 contract |

提示詞：

```text
請檢查 `workshops/index.html` 是否符合 `workshops/DECK.md` 與 `workshops/master-content.md`。
檢查項目：頁數、標題層級、speaker notes、時間、圖片 placeholder、Mermaid render、table readability、1920x1080 無溢出、鍵盤導覽、Esc overview、progress bar。
只列出需修正項目與檔案位置。
```

## 6. Open Design 需要知道的限制

| 限制 | 說明 |
| --- | --- |
| 不限 18 頁 | 內容完整與視覺豐富優先，目前主稿為 35 頁 |
| 不先動 HTML | 在 `master-content.md` 未確認前，不重建 `index.html` |
| 不杜撰資料 | 若來源沒有具體數字、案例、客戶敏感資訊，一律標 `待補` |
| 不使用大面積 serif | 中文與主體簡報內容必須 sans |
| `diagram-design` 不可假設存在 | 目前 repo 未見實體 `skills/diagram-design`，先用 Mermaid + handoff |
| 素材先 placeholder | 圖片、短影片、截圖與 QR 後續再替換 |

## 7. 快速接手檢查清單

1. 先讀 `workshops/HANDOFF.md`。
2. 再讀 `workshops/master-content.md`。
3. 確認目前階段，不要跨階段直接改 HTML。
4. 若要改設計，先更新 `DESIGN.md`。
5. 若要改內容，先更新 `master-content.md`，再同步 `DECK.md`。
6. 若要改 HTML，必須以 `Plan.md`、`DESIGN.md`、`DECK.md` 為依據。
7. 若要生成素材，使用 `master-content.md` 中的素材 ID 與中英提示詞。

## 8. 不清楚時的建議提問

若後續 agent 遇到不確定，不要自行臆測，優先向使用者提供選項：

| 問題 | 建議選項 |
| --- | --- |
| 頁數是否過多 | 保留 35 頁完整版 / 壓縮為 28 頁授課版 / 分成主 deck + appendix |
| 圖片風格 | 真實企業照片 / AI 生成顧問插圖 / 截圖與資訊圖表為主 |
| Notion Demo | 使用真實 workspace 截圖 / 使用 mock screenshot / 只放 placeholder |
| Mermaid 後製 | 保留 Mermaid / 轉 HTML-SVG 靜態圖 / 轉互動圖 |
| 課程時間 | 120 分鐘完整講 / 90 分鐘壓縮版 / 60 分鐘高層摘要版 |
