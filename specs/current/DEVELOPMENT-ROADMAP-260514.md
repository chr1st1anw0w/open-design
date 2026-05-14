---
title: "open-design 開發藍圖"
type: roadmap
created: 2026-05-11
updated: 2026-05-14
design-base: design-systems/Skywalker/Christian Wu Web3 Portfolio.md
---

# open-design — 開發藍圖 260511

> 設計基準：[Skywalker Portfolio](../design-systems/Skywalker/Christian%20Wu%20Web3%20Portfolio.md)  
> 品質框架：plan-design-review 7 維度評分（IA / Interaction / Journey / AI Slop Risk / DS Alignment / A11y / Unresolved）

---

## 一、命名規範（Naming Convention）

### 規則

```
{scope}-{feature-name}-{type}-{yymmdd}.md
```

| 欄位 | 說明 | 範例 |
|------|------|------|
| scope | 功能前綴 f1–f10、或模組名 | `f1-`, `thesys-`, `dev-` |
| feature-name | 全小寫 kebab-case | `conversation-search` |
| type | `-spec` / `-plan` / `-eval` / `-roadmap` / `-requirements` | `-spec` |
| yymmdd | 日期後綴（選用，歧義時加） | `-260511` |

### 現有文件稽核

| 現行路徑 | 狀態 | 建議路徑 |
|----------|------|----------|
| `specs/current/f1-conversation-search.md` | ✅ 已符合 | — |
| `specs/current/f2-artifact-snapshots.md` | ✅ 已符合 | — |
| `specs/current/f3-linked-code-folder.md` | ✅ 已符合 | — |
| `specs/current/f4-skill-design-system-installer.md` | ✅ 已符合 | — |
| `specs/current/DEV-STATUS.md` | ⚠️ 大寫 | `dev-status.md` |
| `specs/current/Thesys-C1-整合評估-260505.md` | ⚠️ 含中文 + 大寫 | `thesys-c1-integration-eval-260505.md` |
| `specs/current/HAND-OFF.md` | ⚠️ 大寫 | `hand-off-260511.md` |
| `specs/current/GPT-IMAGE2-BROWSER-AUTOMATION.md` | ⚠️ 全大寫 | `gpt-image2-browser-automation.md` |

---

## 二、功能狀態清單

### ✅ 已實作（程式碼已存在）

| 功能 | 實作路徑 | 備註 |
|------|----------|------|
| Skywalker Portfolio 基礎框架 | [design-systems/Skywalker/portfolio/](../design-systems/Skywalker/portfolio/) | HTML + JS 完整 |
| **F3 Linked Code Folder** | [apps/daemon/src/linked-dirs.ts](../apps/daemon/src/linked-dirs.ts) | 核心功能已實作 |
| **F5 Critique Theater** | [apps/daemon/src/critique/](../apps/daemon/src/critique/) | orchestrator + scoreboard + parser 完整 |
| **F7 Research Feature** | [apps/daemon/src/research/](../apps/daemon/src/research/) | tavily + cli-args + index 已實作 |
| Notion Import 腳本 | [specs/current/Import-from-notion.py](current/Import-from-notion.py) | 可執行腳本 |

### 🔶 部分實作（骨架存在，功能不完整）

| 功能 | 實作路徑 | 缺口 |
|------|----------|------|
| **F6 Manual Edit Mode** | [apps/web/src/edit-mode/](../apps/web/src/edit-mode/)（source-patches.ts, types.ts, bridge.ts, DiffView.tsx, conflict-resolver.ts） | 衝突解決 UI、diff 視圖、source-backed 鎖定機制已接入；待人工驗證完整流程 |
| **F4 Skill Design System Installer** | [apps/daemon/src/library-install.ts](../apps/daemon/src/library-install.ts)、[apps/daemon/src/mcp-install-info.ts](../apps/daemon/src/mcp-install-info.ts) | Design System token 注入流程缺失 |

### 🔲 未實作（僅規格，無程式碼）

| 功能編號 | 功能名稱 | 規格來源 |
|----------|----------|----------|
| **F1** | Conversation Search（對話搜尋） | [f1-conversation-search.md](current/f1-conversation-search.md) |
| **F2** | Artifact Snapshots（版本快照） | [f2-artifact-snapshots.md](current/f2-artifact-snapshots.md) |
| **F8** | AI Assistant Panel + Thesys C1 整合 | [Thesys-C1-整合評估-260505.md](current/Thesys-C1-整合評估-260505.md) |
| **F9** | Thesys C1 + ElevenLabs 語音整合 | [thesys-c1-elevenlabs-integration-plan.md](current/thesys-c1-elevenlabs-integration-plan.md) |
| **F10** | Runtime Adapter（跨環境適配） | [runtime-adapter.md](current/runtime-adapter.md) |

---

## 三、開發藍圖（以未來開發為主軸）

### Tier 1 — 補完已有骨架（立即可動）

#### F6 Manual Edit Mode 完整化
- **規格**：[manual-edit-mode-requirements.md](current/manual-edit-mode-requirements.md)
- **現況**：edit-mode/ 有 bridge、source-patches、types，但 UI 與衝突解決缺失
- **目標**：實作 source-backed diff UI、手動覆蓋鎖定邏輯
- **預估工期**：2 週
- **複雜度**：7/10
- **AI Slop 風險**：⚠️ diff 視圖若使用通用 card 樣式 → 需對齊 Skywalker 色彩 token
- **交付物**：`apps/web/src/edit-mode/DiffView.tsx`、衝突解決服務
- **2026-05-14 進度**：
  - 已新增 `DiffView.tsx`
  - 已新增 `conflict-resolver.ts`
  - 已補齊 line diff / locked line metadata
  - 已接入 `ManualEditPanel` / `FileViewer`
  - 已新增 `--color-diff-add` / `--color-diff-remove` / `--color-diff-modify`
  - 尚待手動驗證真實 AI → manual → resolve 流程

#### F4 Skill Design System Installer 完整化
- **規格**：[f4-skill-design-system-installer.md](current/f4-skill-design-system-installer.md)
- **現況**：library-install.ts 骨架存在，Design System token 注入流程缺失
- **目標**：安裝 skill 時自動注入 Skywalker token 至 prompt context
- **預估工期**：1.5 週
- **複雜度**：6/10

---

### Tier 2 — 新功能核心（中期攻堅）

#### F1 Conversation Search（對話搜尋）
- **規格**：[f1-conversation-search.md](current/f1-conversation-search.md)
- **現況**：完全未實作
- **目標**：對話歷史索引（SQLite FTS5）+ 前端 Quick Switcher 整合
- **預估工期**：2 週
- **複雜度**：5/10
- **相依**：`apps/daemon/src/db.ts`（SQLite 已有）、`apps/web/src/quickSwitcherRecents.ts`（UI 進入點）
- **AI Slop 風險**：低（純搜尋 UI，設計簡單）

#### F2 Artifact Snapshots（版本快照）
- **規格**：[f2-artifact-snapshots.md](current/f2-artifact-snapshots.md)
- **現況**：`live-artifacts/` 已有 store/refresh 基礎，但無版本化機制
- **目標**：Artifact 版本快照儲存、時間軸回溯 UI
- **預估工期**：2.5 週
- **複雜度**：7/10
- **AI Slop 風險**：⚠️ 時間軸元件若使用通用 timeline 樣式 → 需自訂 Skywalker 版本

---

### Tier 3 — AI 差異化核心（重點攻堅）

#### F8 AI Assistant Panel + Thesys C1 整合
- **規格**：[Thesys-C1-整合評估-260505.md](current/Thesys-C1-整合評估-260505.md)、[thesys-c1-elevenlabs-integration-plan.md](current/thesys-c1-elevenlabs-integration-plan.md)
- **現況**：完全未實作
- **目標**：Portfolio 的核心差異化 AI 對話介面
- **預估工期**：3–4 週
- **複雜度**：9/10
- **架構方向**：
  ```
  User Input
      ↓
  Thesys C1（UI 生成引擎）
      ↓ 輸出受 Skywalker Design Token 約束
  Design Gate（plan-design-review 7 維度自動評分）
      ↓ 通過閾值 ≥ 6/10
  AI Assistant Panel（前端渲染）
      ↓ 可選
  ElevenLabs TTS（語音輸出層 F9）
  ```
- **AI Slop 防護閘道（必須實作）**：
  - ❌ 禁止紫/藍漸層背景卡片
  - ❌ 禁止 icon 放在彩色圓圈中
  - ❌ 禁止所有元素置中
  - ❌ 禁止通用 hero 文案（"Your AI Assistant"、"Powered by AI"）
  - ✅ 強制對齊 Skywalker `--color-primary`、`--font-heading` token
  - ✅ C1 輸出後觸發自動評分，低於 6/10 拒絕渲染

#### F9 ElevenLabs 語音整合
- **規格**：[thesys-c1-elevenlabs-integration-plan.md](current/thesys-c1-elevenlabs-integration-plan.md)
- **相依**：F8 完成後進行
- **預估工期**：1.5 週（相依 F8 架構）
- **複雜度**：6/10

---

### Tier 4 — 系統整合（後期）

#### F10 Runtime Adapter
- **規格**：[runtime-adapter.md](current/runtime-adapter.md)
- **目標**：跨 web / desktop / daemon 環境的統一 runtime 適配層
- **預估工期**：2 週（系統穩定後進行）
- **複雜度**：8/10
- **相依**：F1/F2/F8 全部完成

---

## 四、Thesys C1 整合策略摘要

```
整合目標：AI Assistant Panel 使用 Thesys C1 作為對話 UI 生成引擎
設計約束：生成結果必須通過 Skywalker Design Token 過濾層
語音層：ElevenLabs TTS 作為可選語音輸出（F9）
品質閘道：plan-design-review 7 維度自動評分，低於 6/10 拒絕渲染
```

**實作優先序**：
1. 建立 Skywalker token 對照表（CSS vars → C1 constraint params）
2. 實作 C1 輸出攔截器（Design Gate middleware）
3. 建立 AI Assistant Panel UI 外殼（Skywalker 品牌化）
4. 接入 ElevenLabs TTS（語音輸出）

---

## 五、工期總覽

| 功能 | Tier | 工期 | 複雜度 | 狀態 |
|------|------|------|--------|------|
| F6 Manual Edit Mode | 1 | 2 週 | 7/10 | 🔶 補完（程式碼完成，待人工驗證） |
| F4 Skill DS Installer | 1 | 1.5 週 | 6/10 | 🔶 補完 |
| F1 Conversation Search | 2 | 2 週 | 5/10 | 🔲 新開發 |
| F2 Artifact Snapshots | 2 | 2.5 週 | 7/10 | 🔲 新開發 |
| F8 AI Panel + Thesys C1 | 3 | 3–4 週 | 9/10 | 🔲 新開發 |
| F9 ElevenLabs 語音 | 3 | 1.5 週 | 6/10 | 🔲 新開發（相依 F8） |
| F10 Runtime Adapter | 4 | 2 週 | 8/10 | 🔲 延後 |
| **總計** | | **~16 週** | | |

> F3 Linked Code Folder、F5 Critique Theater、F7 Research Feature 已有實作基礎，優先進行品質稽核而非重開發。

---

## 六、近期進度更新（2026-05-14）

### 本次完成
- ✅ 對話遮罩修正：移除會覆蓋 chat pane 的藍色填色邏輯  
  路徑：`apps/web/src/index.css`、`apps/web/src/components/FileViewer.tsx`
- ✅ Web 編譯修復：排除備份資料夾，恢復主線可編譯  
  路徑：`apps/web/tsconfig.json`
- ✅ 主線型別對齊：`visual` comment attachment 相關型別補齊  
  路徑：`apps/web/src/types.ts`、`packages/contracts/src/api/comments.ts`、`packages/contracts/src/api/chat.ts`
- ✅ Workshop 設計系統交付  
  路徑：`workshops/design-system.json`

### 驗證結果
- `pnpm --filter @open-design/contracts build`：通過
- `pnpm --filter @open-design/web typecheck`：通過

### 任務狀態調整
- F6 Manual Edit Mode：`🔶 補完（程式碼完成，待人工驗證）`
- F4 Skill DS Installer：`🔶 補完`（狀態不變）
- F1 / F2 / F8 / F9 / F10：狀態不變（尚未進入該階段完整實作）

### 對應開發日誌
- `specs/current/Codex development-log-2026-05-14.md`

---

*由 Claude Code 根據 HAND-OFF.md（Augment Agent 2026-05-11）補完產出*
