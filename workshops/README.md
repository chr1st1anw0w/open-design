# AI Workflow Workshop Deck

此資料夾為「企業 AI Workflow 基礎建設與文件協同轉型工作坊」的主要交付目錄。
目前採「內容總稿先行」流程：先確認 `master-content.md` 的頁面密度、教課備忘與素材需求，再進入 reveal.js HTML deck 實作。

## 檔案結構

- `source/notion-master.md`：內容母本（Notion 匯出）
- `source/notion-spec.md`：生成規格（Notion 匯出）
- `master-content.md`：人類審閱與教課備忘主檔
- `HANDOFF.md`：Open Design agent 接手指南與階段提示詞
- `Plan.md`：後續實作規格與 agent 執行提示詞（待補）
- `DECK.md`：逐頁 deck contract（待依 `master-content.md` 更新）
- `DESIGN.md`：設計標準與 tokens（待切換為 Cobalt Cartesian 方向）
- `index.html`：最終 HTML deck（目前仍是舊版，待後續改為 reveal.js）

## 使用方式

1. 先審閱 `master-content.md`，確認頁面順序、內容密度、講者備忘與素材待辦。
2. 交給下一個 agent 前，先提供 `HANDOFF.md`，再指定目前要進入哪個階段。
3. 確認後再更新 `Plan.md`、`DESIGN.md`、`DECK.md`。
4. 最後才重建 `index.html` 為 reveal.js 5.x 單檔 HTML deck。

## 目前狀態

- 來源 Markdown 已放入 `source/`。
- `master-content.md` 是目前主要審閱文件。
- `HANDOFF.md` 已整理接手路徑、階段文件與對應提示詞。
- `index.html` 暫不作為最新版設計依據。
