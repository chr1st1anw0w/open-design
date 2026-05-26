# Picker Comment Flow Plan

更新日期：2026-05-20

## 目標

將目前 HTML preview 的 `Picker` / `Pods` / comment 操作整理成更接近 Codex comment 與 Claude Design 的單一選取體驗：

- `Picker` 可選任一可見網頁元素，不只限 `data-od-id`。
- 單擊選一個元素。
- `Shift + click` 可複選多個元素。
- 選取後可直接輸入備註、上傳圖片，並統一回傳到 chat panel。
- Picker 單選到圖片元素或單一 iframe 嵌入圖片時，可直接 `Replace`，開啟 Finder 選擇圖片並自動匯入專案資料夾。
- 移除獨立 `Pods` 按鈕；多選能力整合到 `Picker`。
- 保留現有 comment attachment 管線，避免重做 daemon/chat protocol。

## 現況摘要

目前相關實作集中在：

- `apps/web/src/components/FileViewer.tsx`
- `apps/web/src/runtime/srcdoc.ts`
- `apps/web/src/comments.ts`
- `apps/daemon/src/server.ts`
- `packages/contracts/src/api/comments.ts`
- `packages/contracts/src/api/chat.ts`

現有能力：

- `Picker` 使用 iframe selection bridge，點擊 `[data-od-id] / [data-screen-label]` 元素後產生 `PreviewCommentTarget`。
- `Pods` 使用 pointer stroke 畫出範圍，將命中的多個 target 包成 `selectionKind: "pod"`。
- comment 會轉成 `ChatCommentAttachment`，在 daemon prompt 中以 `<attached-preview-comments>` 注入給 agent。
- 已支援 visual attachment 欄位，例如 `selectionKind: "visual"`、`screenshotPath`、`markKind`。

現有落差：

- `Picker` 目前偏單選。
- `Pods` 是另一個模式，使用者需要理解第二個概念。
- 未標 `data-od-id` 的普通 DOM 元素無法被 Picker 選到。
- 多選後的備註與 chat composer 之間尚未形成一個自然的 staged selection UX。

## 產品行為設計

### Toolbar

保留：

- `Tweaks` toggle
- `Picker`
- `Inspect`
- `Edit`

移除：

- `Pods`

`Picker` 開啟後進入元素選取模式。按鈕 tooltip 改成：

```text
Pick elements. Shift-click to select multiple.
```

### 選取互動

| 操作 | 行為 |
| --- | --- |
| hover | 高亮目前滑過的可選元素 |
| click | 清空既有選取，選中該元素，開啟備註 popover |
| Shift + click | toggle 該元素是否在多選集合中 |
| click 單一圖片 / 圖片 iframe | popover 顯示 `Replace`，可直接替換該圖片來源 |
| Escape | 清空選取並關閉 popover |
| Backspace / Delete | 移除最後一個選取項 |
| Enter | 在 textarea 中換行或依現有 composer 規則處理 |
| Cmd/Ctrl + Enter | 送出到 chat panel |

### 多選語意

多個元素共用同一則備註時，前端仍可沿用既有 `selectionKind: "pod"`，但 UI 不再顯示 `Pods` 這個概念。

建議命名：

- UI 顯示：`3 selected elements`
- internal selectionKind：`pod`
- daemon prompt：沿用 `targetKind: pod`

理由：

- 既有 DB schema、contract、daemon prompt 已支援 `podMembers`。
- 不需要新增 migration。
- agent 已被告知 pod 是 coordinated design region。

## 技術設計

### 1. 擴充 iframe selection bridge

檔案：

- `apps/web/src/runtime/srcdoc.ts`

目前 `allTargets()` 只查：

```ts
document.querySelectorAll('[data-od-id], [data-screen-label]')
```

調整方向：

- 優先保留 `data-od-id` / `data-screen-label`。
- 對沒有標記的可見元素產生 fallback target。
- fallback target 需要包含：
  - `elementId`: `runtime-${stableHash(cssPath)}`
  - `selector`: 可重建的 CSS path
  - `label`: `tag.class#id` 摘要
  - `text`: trimmed text
  - `position`
  - `htmlHint`
  - `sourceBacked`: false

過濾條件：

- 排除 `html`, `head`, `body`, `script`, `style`, `noscript`, `meta`, `link`。
- 排除寬高小於 `4px` 的元素。
- 排除不可見元素：`display:none`, `visibility:hidden`, `opacity:0`。
- 避免過度選到純容器：若父層與子層高度/寬度幾乎相同，hover 時優先最深層可辨識元素。

### 2. 讓 click payload 帶 modifier keys

檔案：

- `apps/web/src/runtime/srcdoc.ts`
- `apps/web/src/components/FileViewer.tsx`

iframe 送出：

```ts
{
  type: "od:comment-target",
  multi: ev.shiftKey,
  additive: ev.shiftKey,
  ...
}
```

host 接收後：

- `multi !== true`：單選，取代 selection set。
- `multi === true`：toggle selection set。

### 3. FileViewer selection state 改為集合

檔案：

- `apps/web/src/components/FileViewer.tsx`

新增概念：

```ts
selectedCommentTargets: Map<string, PreviewCommentSnapshot>
```

衍生狀態：

- 0 個：無 popover
- 1 個：使用單一 target
- 多個：用 `buildPickerGroupSnapshot()` 組成 `selectionKind: "pod"` target

可重用既有：

- `buildPodSnapshot()` 的 bounds/member 聚合邏輯
- `PreviewCommentMember`
- `targetFromSnapshot()`
- `buildBoardCommentAttachments()`
- `buildVisualAnnotationAttachment()`

建議新增：

```ts
function buildPickerGroupSnapshot(input: {
  filePath: string;
  selected: PreviewCommentSnapshot[];
}): PreviewCommentSnapshot | null
```

這個函式應避免依賴 stroke points，只根據 selected targets 聚合。

### 4. 移除 Pods toolbar，但保留低層能力

檔案：

- `apps/web/src/components/FileViewer.tsx`
- `apps/web/src/runtime/srcdoc.ts`
- `apps/web/src/index.css`

Phase 1 建議：

- 從 toolbar 移除 `Pods` button。
- `BoardTool` 可先保留 `'pod'` 型別與 bridge stroke code，降低改動風險。
- 預設 `boardTool` 永遠走 `'inspect'` / picker。
- 不再讓使用者看見 Pods 模式。

Phase 2 再決定是否清理：

- 移除 pod stroke pointer event。
- 將 internal naming 從 `pod` 漸進改成 `group`。

### 5. Popover 與 chat panel UX

檔案：

- `apps/web/src/components/FileViewer.tsx`
- `apps/web/src/components/ChatPaneLegacy.tsx`
- `apps/web/src/comments.ts`
- `apps/web/src/index.css`

Picker 選取後的 popover 需要顯示：

- 單選：元素 label、selector、text 摘要。
- 多選：`N selected elements`，下方用 chips 顯示前 6 個 target。
- 可輸入一則備註。
- 可上傳圖片，沿用現有 image attachment。
- `Send to chat` 會立即送出 `ChatCommentAttachment[]`。
- `Save comment` 可保留，但多選時先建議只支援送到 chat，不先做 persisted multi-comment。

Chat panel 顯示：

- composer 上方顯示 staged selection chips。
- message history 中顯示 `3 selected elements` 而不是 `pod-...`。
- 若附件包含圖片，顯示 image reference chip。

### 6. Picker 圖片 Replace

檔案：

- `apps/web/src/runtime/srcdoc.ts`
- `apps/web/src/components/FileViewer.tsx`
- `apps/web/src/providers/registry.ts`
- `apps/daemon/src/server.ts`

行為：

- 僅在 Picker 單選一個 target 時顯示 `Replace`。
- target 判定為 replaceable image：
  - `<img>`。
  - `<iframe src="...">` 且 `src` 看起來是圖片格式。
- 點擊 `Replace` 時由 daemon 開啟 native file picker / Finder。
- 支援格式：
  - `png`
  - `jpg`
  - `jpeg`
  - `webp`
  - `gif`
  - `svg`
  - `avif`
- daemon 將選到的圖片複製到專案資料夾，使用和一般 upload 相同的檔名碰撞規則。
- web 端取得匯入後的 project-relative path，將 HTML source 中該 target 的 `src` 改成匯入檔名。
- 成功後 reload preview，並保留既有 comment popover 狀態。

MVP 限制：

- 一次 replace 只使用第一張被選到的圖片。
- 多選 target 不顯示 Replace，避免不明確地把同一張圖套到多個元素。
- 若 target 是 fallback DOM selector 但不能穩定定位到 source，顯示錯誤，不做 best-effort source mutation。

### 7. Daemon prompt 對齊

檔案：

- `apps/daemon/src/server.ts`

現有 `renderCommentAttachmentHint()` 已支援：

- `targetKind: element`
- `targetKind: pod`
- `targetKind: visual`

建議只微調文字：

```text
For grouped selections, coordinate all listed members as one design region.
```

避免 UI 取消 Pods 後 prompt 還暴露過多 pod terminology。

## 開發階段

### Phase 1：Picker 多選 MVP

目的：最快把使用者習慣修正。

工作：

- 移除 toolbar 上的 `Pods` button。
- Picker click 支援 `Shift + click` 多選。
- `FileViewer` 建立 selected target map。
- 多選時用 `selectionKind: "pod"` 送到 chat。
- Popover 顯示多選摘要與 chips。
- 保留既有 image upload。
- 單選圖片 target 顯示 Replace，選圖後自動匯入並替換 `src`。

驗證：

```bash
pnpm --filter @open-design/web typecheck
pnpm --filter @open-design/web test
```

### Phase 2：任一 DOM 元素可 pick

目的：接近 Codex 對網頁任意 div/元件的操作感。

工作：

- 擴充 `srcdoc.ts` target discovery。
- 加入 fallback CSS selector / runtime id。
- hover 優先最深可辨識元素。
- banner 文案從「沒有 data-od-id」改成「可選一般元素，但 data-od-id 會更精準」。

驗證：

- 用沒有 `data-od-id` 的 HTML artifact 測試仍可 hover/click。
- 確認 agent prompt 包含 fallback selector 與 htmlHint。

### Phase 3：Chat panel staged attachments

目的：讓操作更像 Codex comment thread，而不是只是一個 popover。

工作：

- 在 chat composer 顯示從 Picker 選到的 staged targets。
- 支援從 staged chips 移除單一 target。
- 支援「選好元素後直接在 chat input 輸入要求」。
- `Send` 時自動帶入 selected targets。

驗證：

- 單選 + chat input 可送出。
- Shift 多選 + chat input 可送出。
- 圖片 + 多選 + chat input 可送出。

### Phase 4：設計操作打磨

目的：更像 Claude Design / Codex 的即時設計回饋。

工作：

- hover outline 更清楚，但不遮住內容。
- selected outline 顯示序號 badge。
- 多選 chip 可 hover 反查頁面上的元素。
- `Esc`、`Delete`、`Shift-click` 操作一致。
- 避免 toolbar 顯示太多模式詞。

## 風險與決策

### `data-od-id` 與任意 DOM target 的精準度

`data-od-id` 是最精準的 agent 編輯錨點。任意 DOM fallback 只能提供 selector 與 htmlHint，agent 修改成功率會低一些。

建議：

- UI 不阻止 fallback selection。
- prompt 明確告知 `sourceBacked/data-od-id` 與 fallback selector 的差異。
- 對 fallback target 顯示較低調的「best effort」狀態。

### 是否完全移除 pod

不建議第一階段完全移除 `pod` 型別。

理由：

- DB、contracts、daemon prompt 已支援。
- 多選語意剛好可沿用。
- 只需從 UI 移除 Pods 名稱即可。

### 多選送出方式

建議 MVP 用「一則備註套用到一組元素」。

未來可加：

- 每個元素各自備註。
- 選取後在 chat panel 裡拆分 target。
- 對多個 target 套用同一張參考圖。

## 建議實作順序

1. `FileViewer.tsx`：移除 Pods button，加入 selected map 與 Shift-click toggle。
2. `srcdoc.ts`：click payload 加 `multi/additive`。
3. `FileViewer.tsx`：新增 `buildPickerGroupSnapshot()`，多選轉 `selectionKind: "pod"`。
4. `BoardComposerPopover`：多選 chips、移除 target chip、顯示 `N selected elements`。
5. `comments.ts`：讓 grouped selection 的 attachment label 更像 user-facing wording。
6. `server.ts` / `registry.ts`：新增 native image picker import endpoint。
7. `FileViewer.tsx`：Picker 單選 replaceable image target 時顯示 Replace 並套用 source patch。
8. `srcdoc.ts`：擴充任意 DOM target discovery。
9. `server.ts`：微調 grouped selection prompt wording。
10. 補 web tests 與 daemon attachment hint tests。

## 驗收標準

- `Picker` 模式下 click 任一可見元素會出現選取框與備註 popover。
- `Shift + click` 可新增或移除多個元素。
- toolbar 不再出現 `Pods`。
- 多選送出到 chat 後，chat message 帶有 grouped comment attachment。
- 多選 + 圖片上傳可一起送出。
- 單選圖片或圖片 iframe 後可按 Replace，Finder 選圖後圖片自動匯入專案資料夾並更新 HTML。
- 沒有 `data-od-id` 的普通 HTML 元素仍可被選取。
- `pnpm --filter @open-design/web typecheck` 通過。
- `pnpm --filter @open-design/web test` 通過。
- `pnpm exec vitest run -c apps/daemon/vitest.config.ts apps/daemon/tests/comment-attachments.test.ts` 或等價 daemon 測試通過。
