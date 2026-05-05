# F2/F3/F4 執行計劃與 F4 元件 Gallery 評估

更新日期：2026-05-07  
狀態：Codex 執行中  
範圍：F2 artifact snapshots/restore、F3 linked code folder、F4 skill/design-system installer

## 結論

F4 可以做成類似 Claude Design 的「已開發 React 元件 / 範本 Gallery」體驗，但不應直接等同於 upstream `cbe2baf` 的 settings library。建議拆成兩層：

1. **Project Component Gallery**：面向目前專案，列出已產生或匯入的 HTML、React component、圖片與可重用區塊，支援點選引用、拖曳到預覽畫布、加入 prompt context。
2. **Global Library Installer**：面向全域資源，安裝 skill 與 design system，支援搜尋、預覽、啟用/停用、移除使用者安裝項目。

這樣 F4 會更接近 Claude Design 的「可用元件資產面板」，而不是只有管理清單。

## Upstream F4 Commit 評估

參考 commit：`cbe2baf feat(web): add skills & design systems management page in settings (#535)`

### 值得學習

- `LibrarySection` 把 skills 與 design systems 做成同一個管理入口，資訊架構清楚。
- 搜尋、mode/category filter、分組、enable/disable toggle 都是 F4 需要的基本能力。
- Preview 採 lazy fetch，避免 settings 一打開就讀入大量 markdown body。
- 設計系統 swatches 能快速傳達品牌風格，適合延伸成 design-system gallery。

### 應避開

- 它偏 settings 管理頁，沒有支援「把資源帶回 composer / preview 畫布」的工作流。
- Preview 是純 markdown `<pre>`，不適合展示 React component、HTML 範例或 DESIGN.md 的視覺效果。
- 未包含安裝 pipeline，缺少 git URL、上傳 `.md`、安全驗證、使用者安裝目錄與移除保護。
- i18n commit 面積大，若直接 cherry-pick 會污染目前 zh-TW fork 的字典整理。
- 沒有區分 built-in 與 user-installed，刪除/更新權限容易出風險。

## F4 類 Claude Design 元件展示可行性

可行，建議資料來源分三類：

| 來源 | 展示方式 | 初版動作 |
|---|---|---|
| 目前專案檔案 | `projectFiles` 推導 component candidates | 點選加入 composer、拖曳到預覽畫布 |
| React component artifact | 讀 `artifactManifest.renderer === react-component` 或 `.tsx/.jsx` | iframe/sandbox preview、匯出 JSX/ZIP |
| Skill example / template | 使用已生成 `thumbnail.png` 與 `example.html` | 快速預覽、使用 prompt、安裝到全域 |
| Design system | swatches + DESIGN.md summary + showcase preview | 啟用、引用、安裝/移除 |

初版不建議嘗試完整解析任意 React 專案 AST。先以 artifact manifest、檔案副檔名、目前專案檔案列表和 thumbnails 建立穩定 gallery，再逐步加入 AST/component metadata。

## 執行順序

### Phase 1：F2 Artifact Snapshots/Restore

目標：
- 後端每次覆寫前建立 `.snapshots/<path>/<timestamp>.<ext>`。
- 前端 FileViewer 顯示版本歷史。
- 使用者可預覽、復原，復原前自動保存目前版本。

目前狀態：
- 後端 `projects.ts` snapshot 函式已存在。
- 後端 `/api/projects/:id/files/*/snapshots` API 已存在。
- `packages/contracts/src/api/files.ts` 已有 Snapshot 型別。
- 缺口是 FileViewer 前端 UI 與 registry helper。

驗收：
- `pnpm --filter @open-design/web typecheck`
- `pnpm --filter @open-design/daemon build`
- 手動覆寫檔案後可在 FileViewer 看見快照並復原。

### Phase 2：F3 Linked Code Folder

目標：
- 使用者可把本機資料夾關聯到 project metadata。
- Agent 後續對話可透過 `extraAllowedDirs` 讀取該資料夾。
- Composer 顯示已關聯資料夾，且不與「匯入目前專案內資料夾」混淆。

目前狀態：
- 後端 linked-dirs API 已存在。
- chat flow 已把 `metadata.linkedDirs` 合併進 `extraAllowedDirs`。
- contract 已有 `ProjectMetadata.linkedDirs`。
- 缺口是前端缺少真實 link/unlink UI；目前 composer 的 code panel 只從 project files 推導資料夾，且已有局部語法/重複片段需要清理。

驗收：
- POST/DELETE linked-dirs 可更新 project metadata。
- Composer 顯示 metadata 中的 linked dirs。
- 下一次 `/api/chat` 帶入 `extraAllowedDirs`。

### Phase 3：F4 Skill & Design System Installer

目標：
- 把 upstream library management 的搜尋、分組、preview、enable/disable 吸收進目前 UI。
- 增加安全的 user-installed skill/design-system 安裝與移除。
- 延伸為可展示 React component / current project gallery 的 library surface。

建議初版：
- Settings 或 Import menu 加「Library」分頁。
- Skill/design-system 列表採 thumbnails + markdown summary + swatches。
- 安裝先支援 `https://` git URL 與單檔 `.md` upload。
- 刪除只允許 user-installed 目錄，不刪內建 `skills/`、`design-systems/`。

不納入初版：
- 任意 GitHub repo 深度索引。
- 自動解析大型 React codebase component graph。
- 跨專案 marketplace signing。
- 會牽涉 thesys-c1 的 provider/runtime 設定。

## 風險與護欄

- `thesys-c1` 正由另一個 agent 處理，本計劃不修改該 spec 或相關 provider。
- F3 會開放 agent 讀取外部資料夾，必須保留絕對路徑驗證、blocked prefixes、數量上限。
- F4 安裝器必須區分 built-in 與 user-installed，避免 UI 刪除 repo 內建資源。
- Gallery preview 應優先使用 PNG thumbnail，只有使用者實際預覽時才載入 HTML/React runtime。
