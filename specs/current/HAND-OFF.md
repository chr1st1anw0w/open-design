---
title: "HAND-OFF-open-design-260511"
type: project
category: development
tags: [hand-off, open-design, design-review, roadmap, claude-code, skywalker, thesys-c1]
status: active
created: 2026-05-11
updated: 2026-05-11
author: perplexity-ai
---

# HAND-OFF: open-design 規格設計審查規劃

> **用途**：本文件為 Augment Code Agent 對話的完整交接文件，供 Claude Code 接續執行，無需重新探索已完成工作。

---

## 背景與原始任務

**觸發時間**：2026-05-11 20:41（Taipei Time）  
**執行環境**：`/Users/christianwu/open-design/`  
**原始指令**：`/plan-design-review`

### 原始任務目標

使用者要求針對 `specs/current` 目錄下的規格文檔進行深度分析，並完成以下五項任務：

1. **命名規範與文檔整理**：建立有序、標準化的命名規則（Naming Convention），並製作帶有嵌入相對路徑的開發計劃 `.md`。
2. **功能狀態清單**：明確區分「已開發」與「待開發」的功能特徵。
3. **開發藍圖規劃**：針對待開發功能，建議開發優先順序，並標註預估開發週期（工期）與技術複雜度（Complexity）。
4. **重點實施目標**：開發規劃以 `design-systems/Skywalker/Christian Wu Web3 Portfolio.md` 為設計基準。
5. **技術整合建議**：針對 Portfolio 中「AI Assistant Panel（AI 對話視窗）」規劃如何整合 `thesys/c1` 工具。

**品質標準**：輸出需符合 `plan-design-review` 技能的設計維度評分標準（0–10 分），並預先識別 AI Slop（AI 生成式粗糙感）風險信號。

---

## Augment Agent 已完成工作

### 已讀取的文件清單

以下文件已被 Augment Agent 成功讀取（不需重讀，除非驗證用途）：

#### 技能與設計規範
- `.augment/skills/gstack/plan-design-review/` — 評分維度規格（sed 讀取 1–330 行）
- `design-systems/AGENTS.md`
- `design-systems/Skywalker/README.md`
- `design-systems/Skywalker/SKILL.md`
- `design-systems/Skywalker/Christian Wu Web3 Portfolio.md` ✅ 核心設計基準

#### Skywalker Portfolio 實作檔案
- `design-systems/Skywalker/portfolio/index.html`
- `design-systems/Skywalker/portfolio/js/app.js`
- `design-systems/Skywalker/portfolio/js/data.js`
- `design-systems/Skywalker/portfolio/js/components.js`
- `design-systems/Skywalker/portfolio/js/screens.js` ✅（重複讀取兩次，重點檔案）
- `design-systems/Skywalker/portfolio/css/` 目錄（已掃描結構）

#### specs/current 規格文件
| 文件路徑 | 說明 |
|---|---|
| `specs/current/DEV-STATUS.md` | 開發狀態主文件 ✅ |
| `specs/current/status.md` | 狀態補充 |
| `specs/current/f2-f3-f4-execution-plan.md` | F2/F3/F4 執行計劃 |
| `specs/current/f1-conversation-search.md` | F1：對話搜尋功能規格 |
| `specs/current/f2-artifact-snapshots.md` | F2：Artifact 快照 |
| `specs/current/f3-linked-code-folder.md` | F3：連結程式碼資料夾 |
| `specs/current/f4-skill-design-system-installer.md` | F4：技能設計系統安裝器 |
| `specs/current/architecture-boundaries.md` | 架構邊界 |
| `specs/current/research-feature.md` | Research 功能規格 |
| `specs/current/manual-edit-mode-requirements.md` | 手動編輯模式需求 ✅ |
| `specs/current/runtime-adapter.md` | Runtime Adapter |
| `specs/current/maintainability-roadmap.md` | 可維護性路線圖 |
| `specs/current/skills-and-design-templates.md` | 技能與設計模板 |
| `specs/current/critique-theater.md` | Critique Theater 規格 ✅ |
| `specs/current/critique-theater-plan.md` | Critique Theater 計劃 |
| `specs/current/Thesys-C1-整合評估-260505.md` | Thesys C1 整合評估 ✅ |
| `specs/current/thesys-c1-elevenlabs-integration-plan.md` | Thesys C1 + ElevenLabs 整合計劃 |
| `specs/current/Import-from-notion.py` | Notion 匯入腳本 |
| `specs/current/run.md` | 執行說明 |
| `portfolio` 目錄 | 已讀取結構 |

### 語意搜尋（Codebase Search）已執行查詢

以下語意搜尋已完成，但**未獲得有效命中結果**（可能因為功能尚未實作）：

- `"Where are Critique Theater or Design Jury features..."` → 未命中
- `"Where is Manual Edit Mode or source-backed artifacts..."` → 未命中  
- `"Where are project lifecycle status, research mode..."` → 未命中
- `"Where are thesys c1 integration plans or references..."` → 未命中

**推論**：上述四項功能均為**待開發狀態**，僅存在規格文件，尚無實作程式碼。

### 掃描失敗與工具調整記錄

- `rg`（ripgrep）未安裝於本機環境，已改用 `grep -R` 及 Python 腳本替代
- 多次 `grep -R` 因 `node_modules`/大型目錄造成逾時（Timeout）
- Python 腳本多次被 `Kill Process` 中止，`Read Process` 輸出未產生有效資料
- **結論：`apps/web` 與 `apps/daemon` 的既有實作掃描尚未完成**
- augment conversation log: `/Users/christianwu/open-design/specs/current/augment-log.json`
---

## 功能狀態判斷（基於已讀規格）

### ✅ 已開發功能（規格 + 實作跡象）

| 功能 | 路徑依據 | 備註 |
|---|---|---|
| Skywalker Portfolio 基礎框架 | `design-systems/Skywalker/portfolio/` | HTML + JS 四大模組完整 |
| 設計系統基準（Skywalker） | `design-systems/Skywalker/` | README + SKILL + Portfolio.md 齊全 |
| Notion 匯入腳本 | `specs/current/Import-from-notion.py` | 已有可執行腳本 |
| plan-design-review 技能框架 | `.augment/skills/gstack/plan-design-review/` | 評分維度文件已存在 |

### 🔲 待開發功能（規格存在，實作未命中）

| 功能編號 | 功能名稱 | 規格來源 | 預估複雜度 |
|---|---|---|---|
| F1 | Conversation Search（對話搜尋） | `f1-conversation-search.md` | 中（需 index + query） |
| F2 | Artifact Snapshots（快照） | `f2-artifact-snapshots.md` | 中高 |
| F3 | Linked Code Folder（連結程式碼資料夾） | `f3-linked-code-folder.md` | 中 |
| F4 | Skill Design System Installer | `f4-skill-design-system-installer.md` | 高 |
| F5 | Critique Theater / Design Jury | `critique-theater.md` / `critique-theater-plan.md` | 高（多角色 AI） |
| F6 | Manual Edit Mode（手動編輯模式） | `manual-edit-mode-requirements.md` | 高（衝突解決機制） |
| F7 | Research Feature（研究功能） | `research-feature.md` | 中高 |
| F8 | AI Assistant Panel + Thesys C1 整合 | `Thesys-C1-整合評估-260505.md` | 極高 |
| F9 | Thesys C1 + ElevenLabs 語音整合 | `thesys-c1-elevenlabs-integration-plan.md` | 高 |
| F10 | Runtime Adapter | `runtime-adapter.md` | 高（跨環境適配） |

---

## 未來開發優先順序建議

> 使用者明確表示：「**更注重在未來開發**」，以下優先順序以此為主軸。

### Tier 1：基礎核心（先行實作）

**F3 — Linked Code Folder**：建立規格與程式碼的連結機制，是後續所有功能的基礎索引依賴，複雜度相對可控。預估工期：**1.5 週**。

**F1 — Conversation Search**：提升工作流可檢索性，直接支援開發者每日使用效率。基於現有對話資料結構，實作索引與查詢介面。預估工期：**2 週**。

### Tier 2：設計品質核心（中期）

**F6 — Manual Edit Mode**：使用者對 AI 生成內容的精細控制入口，是 AI Slop 防護的關鍵機制。需設計來源衝突解決（source-backed diff）邏輯。預估工期：**2.5 週**，複雜度：**8/10**。

**F7 — Research Feature**：強化設計決策的資訊來源整合能力，可與 Skywalker Portfolio 設計基準形成閉環驗證。預估工期：**2 週**。

### Tier 3：AI 核心功能（重點攻堅）

**F8 — AI Assistant Panel + Thesys C1 整合**：Portfolio 的核心差異化功能，依據 `Thesys-C1-整合評估-260505.md` 進行。建議採用 Thesys C1 作為 UI 生成引擎，搭配現有 Skywalker 設計 Token 進行約束。預估工期：**3–4 週**，複雜度：**9/10**。

**F5 — Critique Theater / Design Jury**：多角色 AI 評審系統，可作為 `plan-design-review` 評分標準的自動化執行層。依賴 F8 完成後的 AI Panel 架構。預估工期：**3 週**，複雜度：**9/10**。

### Tier 4：系統整合（後期）

**F2 — Artifact Snapshots**、**F4 — Skill Design System Installer**、**F9 — ElevenLabs 語音整合**、**F10 — Runtime Adapter** — 系統穩定後進行整合與包裝。

---

## Thesys C1 整合方向摘要

依據 `specs/current/Thesys-C1-整合評估-260505.md` 與 `specs/current/thesys-c1-elevenlabs-integration-plan.md`：

- **整合目標**：AI Assistant Panel 使用 Thesys C1 作為對話 UI 生成引擎
- **關鍵約束**：生成結果需符合 Skywalker Design System Token，避免 AI Slop（通用化、無品牌感的 UI）
- **語音層**：ElevenLabs 整合計劃已存在規格，可作為 Panel 的語音輸出層
- **AI Slop 防護點**：需在 C1 輸出後加入設計審查閘道（Design Gate），對齊 `plan-design-review` 評分維度

---

## Claude Code 接續指令建議

```bash
# 1. 確認環境與目錄結構
ls -la /Users/christianwu/open-design/specs/current
ls -la /Users/christianwu/open-design/apps/

# 2. 讀取核心狀態文件（優先）
cat specs/current/DEV-STATUS.md
cat specs/current/status.md

# 3. 讀取 plan-design-review 評分維度（完整版）
cat /Users/christianwu/.augment/skills/gstack/plan-design-review/*.md | head -400

# 4. 掃描 apps/web/src 既有實作（限縮路徑避免逾時）
find apps/web/src -name "*.ts" -o -name "*.tsx" | head -50

# 5. 產出開發計劃 Markdown
# 路徑建議：specs/DEVELOPMENT-ROADMAP-260511.md
```

---

## 命名規範建議（Naming Convention）

基於已讀規格文件的命名模式，建議統一採用：

```
{scope}-{feature-name}-{type}-{yymmdd}.md

範例：
specs/current/f1-conversation-search.md          ✅ 已符合
specs/current/Thesys-C1-整合評估-260505.md       ⚠️ 建議改為: thesys-c1-integration-eval-260505.md
specs/current/DEV-STATUS.md                       ⚠️ 建議改為: dev-status.md（全小寫統一）
```

**規則摘要**：
- 全英文小寫 + kebab-case（連字符分隔）
- 功能編號前綴（f1-, f2-, ...）用於功能規格類文件
- 日期後綴格式：`yymmdd`
- 類型後綴：`-spec`, `-plan`, `-eval`, `-roadmap`, `-requirements`

---

## 重要注意事項

1. **`apps/web` 掃描未完成**：Augment Agent 多次逾時，無法確認實作程度，Claude Code 應補充此掃描。
2. **`plan-design-review` 評分維度讀取不完整**：僅讀取到約 330 行，需確認完整評分矩陣。
3. **使用者核心優先**：使用者在對話末段明確表示「更注重未來開發」，功能狀態清單的「已開發」部分可輕量處理，重點放在 Roadmap 輸出。
4. **Augment 訂閱中斷**：對話因額度耗盡終止於「彙整規格與功能狀態」任務前，本 Hand-off 文件即替代此任務產出。

---

*本文件由 Perplexity AI 根據 Augment Code Agent 對話記錄自動生成 — 2026-05-11*
