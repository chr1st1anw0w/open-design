# open-design 開發日誌（2026-05-14）

## 1. 任務背景
- 目標：修正對話區被藍色半透明遮罩覆蓋，並整理 workshop / design system 相關交付。
- 主要現象：左側 chat pane 出現大面積藍色區塊，阻擋訊息閱讀與操作。

## 2. 主要變更（依檔案）

### 2.1 對話遮罩修正（UI）
- `apps/web/src/index.css`
  - 將 `.comment-target-overlay` 背景改為透明（只保留框線與 ring）。
  - 將 `.comment-saved-outline` 背景改為透明。
  - 新增防禦式規則：攔截具藍色 inline style 的頁層 overlay，避免覆蓋 chat pane。

- `apps/web/src/components/FileViewer.tsx`
  - 移除 comment overlay 的 `--comment-overlay-bg` 注入。
  - 保留 `outline/ring` 權重，取消 `backgroundOpacity` 流程，避免任何填色回流。

### 2.2 TypeScript 編譯可用性修正
- `apps/web/tsconfig.json`
  - 將 `src/bk`、`src/new` 加入 `exclude`，避免備份版本污染正式編譯。

- `apps/web/src/App.tsx`
  - 移除未落地依賴（analytics/MemoryToast/designTemplates）造成的主線型別錯誤。
  - 對齊 `EntryView`、`ProjectView` 目前實際 props。

- `apps/web/src/types.ts`
  - 對齊現況型別：補齊 `visual` comment selection 與對應附件欄位。
  - 消除重複 export 衝突。

- `packages/contracts/src/api/comments.ts`
  - `PreviewCommentSelectionKind` 納入 `visual`。
  - 新增 `ChatCommentSelectionKind`、`PreviewVisualMarkKind`。

- `packages/contracts/src/api/chat.ts`
  - `ChatCommentAttachment` 補齊 `screenshotPath`、`markKind`、`intent`。

## 3. 文件與規格交付
- `workshops/design-system.json`
  - 新增完整 workshop design system（色彩、字體、spacing、motion、anti-patterns、handoff prompts）。

## 4. 驗證紀錄
- 已執行並通過：
  - `pnpm --filter @open-design/contracts build`
  - `pnpm --filter @open-design/web typecheck`

## 5. 已知情況與處理結論
- `src/bk` 與 `src/new` 保留為參考備份，不作為正式 `apps/web/src` 編譯來源。
- 若仍看見藍框，優先判斷是否為外部瀏覽器標註層（非 app 內 DOM）；app 內可控遮罩來源已移除填色。

## 6. 相關路徑索引（相對路徑）
- `apps/web/src/index.css`
- `apps/web/src/components/FileViewer.tsx`
- `apps/web/src/App.tsx`
- `apps/web/src/types.ts`
- `apps/web/tsconfig.json`
- `packages/contracts/src/api/comments.ts`
- `packages/contracts/src/api/chat.ts`
- `workshops/design-system.json`
- `specs/DEVELOPMENT-ROADMAP-260511.md`

## 7. F6 Manual Edit Mode 補完（2026-05-14）

### 7.1 本次新增
- `apps/web/src/edit-mode/DiffView.tsx`
  - 新增左右並排 diff 視圖。
  - 行級標示新增 / 刪除 / 修改。
  - source-backed 區段顯示鎖定圖示與 tooltip。
  - 衝突區段提供「採用 AI 版本 / 保留手動版本 / 合併」操作。

- `apps/web/src/edit-mode/conflict-resolver.ts`
  - 新增 `resolveConflict(patch, strategy)`。
  - `merge` 策略會保留使用者手動鎖定行。

### 7.2 既有檔案整合
- `apps/web/src/edit-mode/source-patches.ts`
  - 新增 `buildSourcePatch()`、`buildManualEditDiff()`、`collectLockedLines()`。
  - 將手動變更轉為可視 diff 與 locked line metadata。

- `apps/web/src/edit-mode/types.ts`
  - 補齊 `SourcePatch`、`ResolvedPatch`、`DiffLine`、`LockedLine`。
  - `ManualEditTarget` 新增 `sourceBacked`。
  - `ManualEditHistoryEntry` 新增 `sourcePatch`。

- `apps/web/src/edit-mode/bridge.ts`
  - bridge target payload 補上 `sourceBacked`，讓 UI 可區分 source-backed 區段。

- `apps/web/src/components/ManualEditPanel.tsx`
  - changes panel 接入 `DiffView`。
  - 支援衝突列表與 resolve callback。

- `apps/web/src/components/FileViewer.tsx`
  - 手動編輯儲存時同步建立 `SourcePatch`。
  - 檔案外部變更時不再直接清空脈絡，改建立 conflict preview。
  - 新增 conflict resolve 儲存流程。

- `apps/web/src/index.css`
  - 新增 `--color-diff-add`、`--color-diff-remove`、`--color-diff-modify`。
  - 新增 diff view / conflict action / lock badge 樣式。

### 7.3 驗證
- `pnpm --filter @open-design/web typecheck`：通過
- `pnpm --filter @open-design/web test edit-mode`：通過（24 tests）

### 7.4 尚待人工驗證
- Manual Edit Mode 實際操作流程：
  - 修改被 AI 生成內容
  - 再次產生新版本
  - 確認 source-backed 鎖定與 conflict resolve 行為符合預期
