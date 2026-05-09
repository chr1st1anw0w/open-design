# Open Design — UX 優化總覽

**狀態：** 暫停開發（等待 Codex 接手）· 2026-05-05  
**範圍：** 使用者高頻需求功能的優先順序評估與開發路線圖  
**目標讀者：** Codex / 開發者

> **⚠️ 開發狀態：** 本批次功能（F1–F5）的 spec 已完成，目前暫停人工開發，改由 **Codex** 執行實作。每個功能的 Codex 提示詞請見各自的 spec 文件末尾，或參考 [`codex-prompts.md`](./codex-prompts.md)。

---

## 評估方法

以下三個維度決定優先順序：

| 維度 | 說明 |
|---|---|
| **使用頻率** | 使用者每次工作階段都會碰到的路徑 |
| **開發成本** | 基於現有架構的實作工作量（天） |
| **ROI 分數** | 使用頻率 ÷ 開發成本（越高越優先） |

---

## 功能總覽表

| # | 功能 | 使用頻率 | 開發成本 | ROI | 優先 | 狀態 |
|---|---|---|---|---|---|---|
| F1 | **多輪對話歷史搜尋** | ⭐⭐⭐⭐⭐ | 3–5 天 | 🔥🔥🔥 | P0 | ⏸ 待 Codex |
| F2 | **Artifact 版本快照 / 復原** | ⭐⭐⭐⭐⭐ | 5–7 天 | 🔥🔥🔥 | P0 | ⏸ 待 Codex |
| F3 | **關聯程式碼目錄（本機資料夾）** | ⭐⭐⭐⭐ | 5–7 天 | 🔥🔥🔥 | P0 | ⏸ 待 Codex |
| F4 | **技能與設計系統 UI 安裝器** | ⭐⭐⭐⭐ | 4–6 天 | 🔥🔥🔥 | P0 | ⏸ 待 Codex |
| F5 | **匯入選單啟用框架 + 引用其它專案 + 連線 GitHub** | ⭐⭐⭐ | 8–12 天 | 🔥🔥 | P1 | ⏸ 待 Codex |
| F6 | 上傳 .fig 檔案 | ⭐⭐ | 14–21 天 | 🔥 | P2 | 📋 Spec 完成 |
| F7 | 擷取網頁元素 | ⭐⭐ | 21–28 天 | — | P3 | 📋 Spec 完成 |

---

## 本次聚焦：F1–F4（最高 ROI）

### F1 — 多輪對話歷史搜尋

**問題：** 使用者在同一個專案累積數十輪對話後，找不到之前的 artifact 或 prompt。  
**現況：** `db.ts` 已有 `messages` 表，但沒有全文搜尋端點。  
**解法：** SQLite FTS5 + daemon 端點 `GET /api/projects/:id/search` + 前端搜尋 UI。  
**詳細 spec：** [`f1-conversation-search.md`](./f1-conversation-search.md)

---

### F2 — Artifact 版本快照 / 復原

**問題：** Agent 改壞了 HTML，使用者無法回到上一個版本。  
**現況：** `projects.ts` 直接覆寫檔案，沒有版本歷史。  
**解法：** 每次 agent 寫入前自動建立 `.od/projects/<id>/.snapshots/<file>/<ts>.html` 快照，前端加「復原」按鈕。  
**詳細 spec：** [`f2-artifact-snapshots.md`](./f2-artifact-snapshots.md)

---

### F3 — 關聯程式碼目錄

**問題：** 使用者想讓 agent 讀取本機現有的元件庫或設計稿，但沒有辦法指定目錄。  
**現況：** daemon 的 `cwd` 固定在 `.od/projects/<id>/`，agent 無法讀取外部目錄。  
**解法：** 新增 `linked_dirs` 概念，daemon 透過 `--add-dir`（Claude Code）或 symlink 讓 agent 存取。  
**詳細 spec：** [`f3-linked-code-folder.md`](./f3-linked-code-folder.md)

---

### F4 — 技能與設計系統 UI 安裝器

**問題：** 安裝外部 skill 或 DESIGN.md 需要手動操作 CLI，一般使用者無法完成。  
**現況：** `skills.ts` 有完整的掃描邏輯，但沒有 UI 安裝流程。  
**解法：** 前端「匯入」選單的「技能與設計系統」項目實作：URL 輸入 → daemon git clone → 重新掃描 → 出現在選單。  
**詳細 spec：** [`f4-skill-design-system-installer.md`](./f4-skill-design-system-installer.md)

---

### F5 — 匯入選單啟用框架 + 引用其它專案 + 連線 GitHub

**問題：** 「匯入」下拉選單的六個項目全部標示「即將推出」，後端邏輯尚未實作。  
**現況：** UI 骨架（`ImportItem`）和 i18n 鍵值已存在，但無後端支撐。  
**解法：** 分三個子功能實作：(1) 選單啟用框架、(2) 引用其它專案、(3) 連線 GitHub。  
**詳細 spec：** [`.kiro/specs/import-sources/requirements.md`](../.kiro/specs/import-sources/requirements.md)

---

## Codex 執行順序

```text
Week 1:  F1（搜尋）+ F4（安裝器）— 純後端 + 小 UI，可並行
Week 2:  F2（快照）— daemon 寫入鉤子 + 前端 UI
Week 3:  F3（關聯目錄）— daemon 路徑管理 + agent 整合
Week 4:  F5（匯入選單框架 + 引用專案 + GitHub）
```

每個功能都有獨立的 Codex 提示詞，見 [`codex-prompts.md`](./codex-prompts.md)。

---

## 架構影響評估

所有 F1–F4 功能都在現有架構邊界內：

- **不新增外部依賴**（F1 用 SQLite FTS5，F2 用 Node fs，F3 用 symlink/`--add-dir`，F4 用 `child_process.spawn('git')`）
- **不改動 agent adapter**（F3 透過現有的 `extraAllowedDirs` 機制）
- **不影響 Vercel 部署**（F3 在 Topology C 降級為「不支援」提示）
- **符合現有安全模型**（F3 路徑驗證沿用 `resolveSafe()`）
