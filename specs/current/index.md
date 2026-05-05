# Specs Index — Open Design

**最後更新**：2026-05-09  
**當前分支**：`dev` (Local) / `origin/main` (Upstream)

---

## 🛰 GitHub 分支同步狀態

| 類別 | 狀態描述 | 建議行動 |
| --- | --- | --- |
| **Interactive Rebase** | `dev` 正在 rebase 至 `c00bbc8c` (目前進度: 1/15) | 🔄 進行中 (已完成 i18n 整合) |
| **Upstream (main)** | 領先多項 P0 修復（桌面端點擊、OAuth 狀態、SSE 原子寫入） | 建議完成 rebase 後執行 Cherry-pick |
| **Skills Integrity** | **[RESTORED]** `guizang-ppt` 及 `image-analysis` 等 7 項技能已從歷史中復原 | ✅ 已就緒 |
| **New Features** | 已新增 Ollama Cloud, Gemini-3 預覽模型支援 | 待 rebase 完成後驗證 |
| **Local dev** | 包含 `web-design-hue` skill 與 `gpt-image2` 工作台恢復邏輯 | ✅ 已就緒 |

---

## 🚀 開發狀態總覽

| 符號      | 意義                    |
| --------- | ----------------------- |
| ✅ 完成   | 已實作並測試            |
| 🔄 進行中 | 正在開發                |
| ⏸ 暫停    | 等待 Codex 或確認後繼續 |
| 📋 規劃中 | Spec 已寫，等待開始     |
| ❌ 待開發 | 尚未啟動                |

---

## 一、狀態追蹤與同步

| 文件                             | 說明                                              | 狀態        |
| -------------------------------- | ------------------------------------------------- | ----------- |
| [DEV-STATUS.md](./DEV-STATUS.md) | 整體開發進度快照（功能清單、Node 版本、測試計劃） | 🔄 持續更新 |
| [2026-05-09-cherry-pick-analysis.md](./2026-05-09-cherry-pick-analysis.md) | **[NEW]** GitHub 關鍵變更分析與複製建議 | ✅ 已完成   |
| [upstream-sync-sop-zh-tw.md](./upstream-sync-sop-zh-tw.md) | 上游代碼同步與衝突處理解決標準作業程序 (SOP) | ✅ 已完成   |

---

## 二、架構規格

| 文件                                                       | 說明                                              | 狀態      |
| ---------------------------------------------------------- | ------------------------------------------------- | --------- |
| [architecture-boundaries.md](./architecture-boundaries.md) | 系統邊界定義（daemon / web / contracts 層職責）   | ✅ 完成   |
| [runtime-adapter.md](./runtime-adapter.md)                 | Runtime Adapter 架構（CLI 適配層 + 串流事件格式） | ✅ 完成   |
| [run.md](./run.md)                                         | Run 模型與恢復流程（跨頁面重新連線機制）          | ✅ 完成   |
| [maintainability-roadmap.md](./maintainability-roadmap.md) | 可維護性風險與最佳化路線圖                        | 📋 規劃中 |

---

## 三、功能規格（F 系列）— 準備啟動

> 此批次功能由 **Codex** 負責實作。所有規劃文件已從 `dev` 分支復原。

| 文件                                                                         | 功能                                   | 優先 | 狀態       |
| ---------------------------------------------------------------------------- | -------------------------------------- | ---- | ---------- |
| [f1-conversation-search.md](./f1-conversation-search.md)                     | F1 — 多輪對話歷史搜尋                  | P0   | ⏸ 待 Codex |
| [f2-artifact-snapshots.md](./f2-artifact-snapshots.md)                       | F2 — Artifact 版本快照 / 復原          | P0   | ⏸ 待 Codex |
| [f3-linked-code-folder.md](./f3-linked-code-folder.md)                       | F3 — 關聯程式碼目錄（本機資料夾）      | P0   | ⏸ 待 Codex |
| [f4-skill-design-system-installer.md](./f4-skill-design-system-installer.md) | F4 — Skill & 設計系統 UI 安裝器        | P0   | ⏸ 待 Codex |
| [codex-prompts.md](./codex-prompts.md)                                       | Codex 執行提示詞彙整（F1→F4 執行順序） | —    | ⏸ 等待啟動 |

---

## 四、Garden Tools & 整合

| 文件                                                                     | 說明                                         | 狀態                    |
| ------------------------------------------------------------------------ | -------------------------------------------- | ----------------------- |
| [garden-skills-integration-plan.md](./garden-skills-integration-plan.md) | Garden Skills 遷入 Open Design 架構計劃      | ✅ 完成（遷移階段）     |
| [GPT-IMAGE2-BROWSER-AUTOMATION.md](./GPT-IMAGE2-BROWSER-AUTOMATION.md)   | 瀏覽器自動化整合（OpenCLI CDP，Phase 1）     | ✅ 實作完成，待測試     |
| [gpt-image2-prompt-gallery.md](./gpt-image2-prompt-gallery.md)           | Prompt Templates 圖片庫整合計劃（Phase A–C） | ✅ 實作完成，build 通過 |
| [thesys-c1-elevenlabs-integration-plan.md](./thesys-c1-elevenlabs-integration-plan.md) | Thesys C1 + ElevenLabs UI 整合計劃 | 🔄 Phase 3 開發中 |

---

## 五、Perplexity MCP 優先策略

| 文件                                                                                  | 說明                                                                 | 狀態      |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | --------- |
| [perplexity-mcp-priority-plan-zh-tw.md](./perplexity-mcp-priority-plan-zh-tw.md) | Perplexity 優先 MCP 開發策略（P0），adapter 固定順序：codex → claude-code → api-fallback | 📋 規劃中 |
| [perplexity-mcp-tool-schema.md](./perplexity-mcp-tool-schema.md) | Perplexity P0 MCP tools I/O schema（discovery/planning/document/execution gating） | 🔄 進行中 |
| [perplexity-mcp-rollout-checklist.md](./perplexity-mcp-rollout-checklist.md) | 本機 connector 驗收步驟、go/no-go 與錯誤診斷文案 | 🔄 進行中 |

---

## 七、快速參考

**最新完成**：技能目錄完整性修復（Restore 7+ skills）、i18n 繁中字典整合  
**進行中**：Interactive Rebase (1/15), Thesys C1 Phase 3  
**下一步行動項目**：

- [x] 恢復 `guizang-ppt`, `image-analysis`, `impeccable` 等核心技能檔案
- [ ] 繼續執行 `git rebase --continue` 以完成剩下 14 個 commits 的 pick
- [ ] 驗證 `zh-tw-design-brief`, `iiot-dashboard-ui` 等新技能是否成功載入
- [ ] Codex 啟動 F1–F4 實作
- [ ] GPT Image 2 端對端測試
