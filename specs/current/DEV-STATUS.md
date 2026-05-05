# 開發進度 - 2026-05-05

## ✅ 已完成功能

### 1. Garden Skills 遷移與集成

- **狀態**：✅ 完成（遷移階段）
- **路由**：`/tools/web-design`、`/tools/gpt-image2`
- **檔案**：`apps/web/src/garden/web-design/`、`apps/web/src/garden/gpt-image2/`
- **資源**：`apps/web/public/garden/`
- **後端端點**：save-prompt、archive、list-archive、load-template-md（占位符）
- **待完成**：generate 端點、copilot refinement、項目連接

### 2. Pet Rail 功能化

- **狀態**：✅ 完成（第 1 階段）
- **快捷方式**：Web Design + Prompt Studio
- **檔案修改**：
  - `apps/web/src/components/pet/PetRail.tsx`：添加快捷方式區塊（第 119–147 行）
  - `apps/web/src/index.css`：快捷方式樣式（`.pet-rail-shortcuts*` 類別）
- **功能**：兩個導航按鈕，點擊跳轉至工具
- **待完成**：更多快捷方式、項目上下文感知

### 3. Operation Design System ID 基礎設施

- **狀態**：✅ 完成（基礎層）
- **架構**：
  - `packages/contracts/src/api/projects.ts`：添加 `operationDesignSystemId?: string | null` 欄位
  - `apps/web/src/components/GardenToolPage.tsx`：添加狀態管理 + useEffect hook
  - `apps/web/src/components/GardenToolPage.css`：CSS 變數映射（`--od-operation-bg`, `--od-operation-text`）
- **實現**：占位符色樣映射（設置 CSS 變數）
- **待完成**：
  - AppChromeHeader 設計系統下拉選擇器
  - 實際色樣 → CSS 變數映射邏輯
  - 項目級別設計系統應用

### 4. TypeScript 構建修復

- **狀態**：✅ 完成
- **修復**：
  - GardenToolPage 添加 `import React`（修復 UMD global 錯誤）
  - PetRail 移除 i18n 翻譯呼叫，改用硬編碼 "Quick Access"（修復 type error）
- **驗證**：`pnpm build` 通過，無 TypeScript 錯誤

---

## ⏳ 待開發功能

### P0 — 即刻優先（10–12 天）

#### F4 — 技能與設計系統 UI 安裝器 [4–6 天]

- **目標**：使用者可從 UI 安裝 skill（git URL）或上傳 SKILL.md / DESIGN.md
- **後端**（`apps/daemon/src/server.ts`）：
  - [ ] POST `/api/skills/install` — git clone + git pull 邏輯
  - [ ] POST `/api/skills/upload` — 上傳 SKILL.md，解析 frontmatter
  - [ ] POST `/api/design-systems/upload` — 上傳 DESIGN.md
  - [ ] DELETE `/api/skills/:id` — 移除已安裝 skill（路徑驗證防護）
  - [ ] 重新掃描機制（安裝後重新加載列表）
- **前端**（`apps/web/src/components/ChatComposer.tsx`）：
  - [ ] SkillInstallerPanel 元件（兩個 tab：URL + Upload）
  - [ ] 加載狀態、錯誤處理
  - [ ] 檔案上傳邏輯
- **i18n**：
  - [ ] 8 個新鍵值（en.ts、zh-TW.ts）
- **型別**（`packages/contracts`）：
  - [ ] InstallSkillRequest / InstallSkillResponse

#### Garden Skills 後端完成 [2–3 天]

- [ ] **load-template-md**：解析 GPT-Image 模板 markdown，返回 Prompt Studio 預期格式
- [ ] **generate 端點**：
  - 決策：browser automation vs OpenAI image API vs 既有 media service
  - 實現 prompt → image 生成
  - 輸出存儲（project files 或 `.od/garden/` 獨立目錄）
- [ ] **copilot/refinement**：移除 browser-side Gemini 假設，通過 daemon config
- [ ] **Project connection**：
  - "Send to current project" 按鈕
  - Design Files 整合

### P1 — 次優先（3–5 天）

- [ ] **設計系統色樣映射**：完整的 swatches → CSS variable 對應
- [ ] **AppChromeHeader 設計系統選擇器**：下拉菜單選擇項目級別設計系統
- [ ] **Pet Rail 增強**：更多快捷方式（iiot-dashboard-ui、proposal-deck 等）
- [ ] **項目上下文感知**：快捷方式根據當前專案變化

### P2 — 可選（1–2 天）

- [ ] **視覺驗證自動化**：Playwright 截圖測試（desktop + mobile）
- [ ] **Performance 監控**：Lighthouse score 追蹤
- [ ] **Garden 資源最佳化**：video.mp4 修復、image binary 驗證

---

## 📋 當前 Node/Package 版本

| 工具    | 預期            | 實際       | 狀態                        |
| ------- | --------------- | ---------- | --------------------------- |
| Node.js | `~24`           | `v22.20.0` | ⚠️ 版本差異（但應用可運行） |
| pnpm    | `>=10.33.2 <11` | `10.33.2`  | ✅ 符合                     |

> Node 版本差異不影響當前開發；若需 Node 24，可在終端運行 `nvm use 24`。

---

## 🧪 測試計劃

### Unit Tests

- [ ] POST /api/skills/install 拒絕 http:// URL（400）
- [ ] POST /api/skills/install 拒絕含特殊字元的 repo 名稱
- [ ] DELETE /api/skills/:id 拒絕刪除內建 skill

### Integration Tests

- [ ] 上傳 SKILL.md 後 GET /api/skills 包含新 skill
- [ ] 上傳 DESIGN.md 後 GET /api/design-systems 包含新 design system
- [ ] Garden generate 端點返回預期格式圖像

### E2E Tests

- [ ] Pet Rail 快捷方式導航成功
- [ ] Skill 安裝面板 UI 互動流暢
- [ ] 設計系統選擇器更新頁面樣式

---

## 📝 備註

1. **Node 版本警告**：專案預期 Node ~24，但實際是 v22.20.0。此差異目前不影響開發；若有特定 Node 24 功能被使用，會在構建時報錯。

2. **i18n 密鑰**：Pet Rail 快捷方式目前硬編碼 "Quick Access" 以避免 type 錯誤；正式版應將其加入翻譯字典。

3. **占位符實現**：
   - Operation Design System 色樣映射仍為占位符（設置 `--od-operation-bg` 和 `--od-operation-text`，但未實現實際的色樣 → CSS 變數對應）
   - Garden generate 端點回傳 501，需要實現完整的圖像生成邏輯

4. **後續優化方向**：
   - Skill 安裝器完成後，可考慮添加「推薦 skill」市場
   - Garden tools 與 Open Design project 的深度整合（共享資料模型、版本控制等）
   - 設計系統的 theme switching 與 accessibility 驗證自動化

---

**最後更新**：2026-05-05 22:20  
**負責人**：Claude Code  
**分支**：`docs/import-sources-codex-handoff`
