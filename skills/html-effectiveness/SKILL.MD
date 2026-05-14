---
title: "HTML Effectiveness Agent Skill-260514"
type: note
category: development
tags: [html, ai-agent, claude-code, skill, output-format, markdown-alternative]
status: active
created: 2026-05-14
updated: 2026-05-14
author: Perplexity AI
---

# HTML Effectiveness — Agent Skill

## Overview

此 Skill 指導 AI Agent（Claude Code、Cursor、Codex 等）在適當情境下優先輸出自包含的單一 `.html` 檔案，而非純 Markdown 文字。靈感來源：Thariq Shihipar 的文章《The Unreasonable Effectiveness of HTML》，以及其配套的 [20 個範例倉庫](https://github.com/ThariqS/html-effectiveness)。每個範例都可以在此文件相對路徑跟目錄找到。

核心原則：當內容需要**空間排版、平行比較、互動操作或視覺層次**時，HTML 的可讀性與實用性遠勝於 Markdown。

---

## 觸發條件（When to Output HTML）

當使用者請求或任務需求符合以下任一情境時，優先產出 HTML：

### 應輸出 HTML 的情境

| 情境類型 | 典型請求關鍵字 | 對應範例 |
|---------|--------------|---------|
| 探索與選項比較 | "比較三種方案"、"列出選項"、"視覺化差異" | `01`, `02` |
| 程式碼審查 | "PR 審查"、"理解這段程式碼" | `03`, `04` |
| 設計系統 | "設計規格"、"元件變體"、"Design Token" | `05`, `06` |
| 互動原型 | "動畫示意"、"互動流程" | `07`, `08` |
| 簡報投影片 | "製作簡報"、"slide deck" | `09` |
| SVG 插圖 | "圖解說明"、"流程示意圖" | `10`, `13` |
| 狀態報告 | "現況報告"、"Incident report" | `11`, `12` |
| 研究解說 | "解釋這個概念"、"功能介紹" | `14`, `15` |
| 執行計畫 | "實作計畫"、"PR writeup" | `16`, `17` |
| 互動工具 | "Triage board"、"Feature flags"、"Prompt tuner" | `18`, `19`, `20` |

### 應繼續使用 Markdown 的情境

- 單純的文字筆記或說明
- 版本控制 diff 或 changelog
- 需要被其他工具 parse 的結構化資料
- 使用者明確要求 `.md` 格式

---

## 輸出規格（Output Specification）

所有 HTML 輸出必須符合以下規格：

### 自包含原則

```
- 單一 .html 檔案，無外部依賴
- 所有 CSS 以 <style> 標籤內嵌
- 所有 JS 以 <script> 標籤內嵌
- 圖片使用 inline SVG 或 base64 Data URI
- 不依賴任何 CDN 或外部 framework
```

### 視覺品質標準

```
- 使用系統字型堆疊（-apple-system, BlinkMacSystemFont, sans-serif）
- 配色採用 CSS 自訂屬性（--color-*），方便調整
- 預設支援 Light Mode；可選加入 prefers-color-scheme: dark
- 內距與行距遵循 8px 基礎格柵
- 響應式佈局（至少支援 320px–1440px 寬度）
```

### 互動功能（依需求選用）

```
- Tabs / 折疊區塊：內容分類瀏覽
- 可排序表格：資料比較
- 狀態切換：Kanban / Triage board
- 即時篩選：搜尋、過濾
- 動畫過渡：CSS transition / animation
```

---

## 20 個官方範例速查

以下為 [ThariqS/html-effectiveness](https://github.com/ThariqS/html-effectiveness) 倉庫中全部範例，每個檔案皆可直接在瀏覽器開啟或本地端與此文件同資料夾目錄內瀏覽：

### Exploration & Planning（探索規劃）

- **01** `exploration-code-approaches` [01-exploration-code-approaches.html](01-exploration-code-approaches.html)  — 並列比較多種技術方案的優缺點
- **02** `exploration-visual-designs`  [02-exploration-visual-designs.html](02-exploration-visual-designs.html) — 視覺設計選項的空間排版比較
- **16** `implementation-plan` —  [03-code-review-pr.html](03-code-review-pr.html) 帶甘特圖概念的執行計畫

### Code Review（程式碼審查）

- **03** `code-review-pr` [03-code-review-pr.html](03-code-review-pr.html)  — PR 審查：diff 標示 + 評論區
- **04** `code-understanding` [04-code-understanding.html](04-code-understanding.html)  — 程式碼架構解說：模組關係視覺化

### Design System（設計系統）

- **05** `design-system`  [05-design-system.html](05-design-system.html) — Design Token 規格展示頁
- **06** `component-variants` [06-component-variants.html](06-component-variants.html)  — UI 元件變體對照表

### Prototype（互動原型）

- **07** `prototype-animation`  [07-prototype-animation.html](07-prototype-animation.html) — CSS/JS 動畫效果示意
- **08** `prototype-interaction` [08-prototype-interaction.html](08-prototype-interaction.html)  — 互動流程模擬（表單、狀態機）

### Slides & Visuals（簡報視覺）

- **09** `slide-deck`  [09-slide-deck.html](09-slide-deck.html) — 可用鍵盤翻頁的 HTML 投影片
- **10** `svg-illustrations` [10-svg-illustrations.html](10-svg-illustrations.html)  — 內嵌 SVG 插圖集合

### Reports（報告）

- **11** `status-report` [11-status-report.html](11-status-report.html)  — 專案狀態報告（進度指示器、KPI）
- **12** `incident-report`  [12-incident-report.html](12-incident-report.html) — 事件報告（時間軸、影響評估）
- **17** `pr-writeup`  [17-pr-writeup.html](17-pr-writeup.html)  — 功能發布的 PR 說明文件

### Diagrams（圖表）

- **13** `flowchart-diagram` [13-flowchart-diagram.html](13-flowchart-diagram.html)  — 純 SVG/HTML 流程圖

### Research（研究解說）

- **14** `research-feature-explainer`  [14-research-feature-explainer.html](14-research-feature-explainer.html)   — 產品功能深度解說
- **15** `research-concept-explainer`  [15-research-concept-explainer.html](15-research-concept-explainer.html) — 技術/概念教學頁

### Editors & Interactive Tools（互動工具）

- **18** `editor-triage-board`  [18-editor-triage-board.html](18-editor-triage-board.html) — 可拖曳的議題分類看板
- **19** `editor-feature-flags`  [19-editor-feature-flags.html](19-editor-feature-flags.html) — Feature flag 開關管理介面
- **20** `editor-prompt-tuner` [20-editor-prompt-tuner.html](20-editor-prompt-tuner.html)  — Prompt 調整工具（即時預覽）

---

## Agent 行為規則

在此 Skill 啟用後，Agent 應遵循以下決策流程：

```
收到請求
  ↓
判斷輸出格式
  ├── 需要視覺層次 / 空間排版 / 互動 → 輸出 HTML
  ├── 純文字說明 / 程式碼片段 → 輸出 Markdown
  └── 不確定 → 預設 HTML（優先可讀性）

輸出 HTML 時：
  1. 確認單一檔案、無外部依賴
  2. 套用視覺品質標準
  3. 依內容類型參照對應範例（01–20）
  4. 檔名以語意命名，例如 feature-comparison.html
```

---

## 延伸資源

- 原始倉庫：https://github.com/ThariqS/html-effectiveness
- 範例展示頁：https://thariqs.github.io/html-effectiveness/
- 中文翻譯參考：https://github.com/sailor-cmd/html-effectiveness-zh
- 衍生 Agent Skill（含 9 類 20 模板）：https://github.com/Azhi-ss/html-effectiveness

