# Specs Index — Open Design

**最後更新**：2026-05-05  
**分支**：`docs/import-sources-codex-handoff`

---

## 開發狀態總覽

| 符號      | 意義                    |
| --------- | ----------------------- |
| ✅ 完成   | 已實作並測試            |
| 🔄 進行中 | 正在開發                |
| ⏸ 暫停    | 等待 Codex 或確認後繼續 |
| 📋 規劃中 | Spec 已寫，等待開始     |
| ❌ 待開發 | 尚未啟動                |

---

## 一、狀態追蹤

| 文件                             | 說明                                              | 狀態        |
| -------------------------------- | ------------------------------------------------- | ----------- |
| [DEV-STATUS.md](./DEV-STATUS.md) | 整體開發進度快照（功能清單、Node 版本、測試計劃） | 🔄 持續更新 |
| [status.md](./status.md)         | Project card 狀態顯示規格（run 狀態 UI）          | 📋 規劃中   |

---

## 二、架構規格

| 文件                                                       | 說明                                              | 狀態      |
| ---------------------------------------------------------- | ------------------------------------------------- | --------- |
| [architecture-boundaries.md](./architecture-boundaries.md) | 系統邊界定義（daemon / web / contracts 層職責）   | ✅ 完成   |
| [runtime-adapter.md](./runtime-adapter.md)                 | Runtime Adapter 架構（CLI 適配層 + 串流事件格式） | ✅ 完成   |
| [run.md](./run.md)                                         | Run 模型與恢復流程（跨頁面重新連線機制）          | ✅ 完成   |
| [maintainability-roadmap.md](./maintainability-roadmap.md) | 可維護性風險與最佳化路線圖                        | 📋 規劃中 |

---

## 三、功能規格（F 系列）— 等待 Codex 實作

> 此批次功能 spec 已完成，由 **Codex** 負責實作。提示詞見 [`codex-prompts.md`](./codex-prompts.md)。

| 文件                                                                         | 功能                                   | 優先 | 預估   | 狀態       |
| ---------------------------------------------------------------------------- | -------------------------------------- | ---- | ------ | ---------- |
| [f1-conversation-search.md](./f1-conversation-search.md)                     | F1 — 多輪對話歷史搜尋                  | P0   | 3–5 天 | ⏸ 待 Codex |
| [f2-artifact-snapshots.md](./f2-artifact-snapshots.md)                       | F2 — Artifact 版本快照 / 復原          | P0   | 5–7 天 | ⏸ 待 Codex |
| [f3-linked-code-folder.md](./f3-linked-code-folder.md)                       | F3 — 關聯程式碼目錄（本機資料夾）      | P0   | 5–7 天 | ⏸ 待 Codex |
| [f4-skill-design-system-installer.md](./f4-skill-design-system-installer.md) | F4 — Skill & 設計系統 UI 安裝器        | P0   | 4–6 天 | ⏸ 待 Codex |
| [codex-prompts.md](./codex-prompts.md)                                       | Codex 執行提示詞彙整（F1→F4 執行順序） | —    | —      | ⏸ 等待啟動 |
| [ux-optimization-overview.md](./ux-optimization-overview.md)                 | UX 優化總覽（F1–F5 ROI 評估）          | —    | —      | ⏸ 暫停     |

---

## 四、Garden Tools — GPT Image 2

| 文件                                                                     | 說明                                         | 狀態                    |
| ------------------------------------------------------------------------ | -------------------------------------------- | ----------------------- |
| [garden-skills-integration-plan.md](./garden-skills-integration-plan.md) | Garden Skills 遷入 Open Design 架構計劃      | ✅ 完成（遷移階段）     |
| [GPT-IMAGE2-BROWSER-AUTOMATION.md](./GPT-IMAGE2-BROWSER-AUTOMATION.md)   | 瀏覽器自動化整合（OpenCLI CDP，Phase 1）     | ✅ 實作完成，待測試     |
| [gpt-image2-prompt-gallery.md](./gpt-image2-prompt-gallery.md)           | Prompt Templates 圖片庫整合計劃（Phase A–C） | ✅ 實作完成，build 通過 |

| [thesys-c1-elevenlabs-integration-plan.md](./thesys-c1-elevenlabs-integration-plan.md) | Thesys C1 + ElevenLabs UI 整合計劃（4 Phase） | 📋 規劃中，等待確認 |

### GPT Image 2 開發時間線

```
Phase 1 ✅  瀏覽器自動化後端（OpenCLI CDP）
Phase 2 ✅  Workbench「傳送到 ChatGPT」按鈕 + 縮圖預覽 + Lightbox
Phase 3 ✅  Prompt Templates 圖片庫整合（44 items / 7 categories，build 通過）
Phase 4 ❌  圖片備註 + 對話繼續修改（下一階段規劃）
```

---

## 五、Codex 交接資料

| 文件                                   | 說明                                     |
| -------------------------------------- | ---------------------------------------- |
| [codex-prompts.md](./codex-prompts.md) | 完整 Codex 提示詞，按 F1→F4 執行順序排列 |

---

## 六、快速參考

**最新完成**：GPT Image 2 Phase 1–3（瀏覽器自動化 + Workbench UI + 圖片提示詞庫）  
**進行中**：建置驗證通過，等待 Chrome CDP 端對端測試  
**下一步行動項目**：

- [x] gpt-image2-prompt-gallery.md Phase A–C 實作完成
- [ ] GPT Image 2 端對端測試（需 Chrome 以 `--remote-debugging-port=9000` 啟動並登入 ChatGPT）
- [ ] Phase 4：圖片備註 + 對話繼續修改功能（可選）
- [ ] Codex 啟動 F1–F4 實作
