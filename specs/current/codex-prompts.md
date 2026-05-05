# Codex 提示詞彙整

**用途：** 將以下提示詞逐一貼入 Codex，按順序執行。每個任務完成後執行 `pnpm typecheck && pnpm test` 確認通過再繼續下一個。

**執行順序：** F1 → F4 → F2 → F3 → F5a → F5b → F5c

**Repo：** https://github.com/chr1st1anw0w/open-design  
**主要開發分支：** `i18n/zh-tw-ui-dict`  
**推送指令：** `git push fork <branch> --force-with-lease`

---

## F1 — 多輪對話歷史搜尋

**預估工作量：** 3–5 天 | **詳細 spec：** `specs/current/f1-conversation-search.md`

```
你是 Open Design 專案的開發者。請根據 specs/current/f1-conversation-search.md 實作「多輪對話歷史搜尋」功能。

## 任務概述
在 open-design 專案中實作對話搜尋功能，讓使用者可以在專案內搜尋所有對話訊息。

## 需要修改的檔案

### 1. apps/daemon/src/db.ts
在 migrate() 函式中新增 SQLite FTS5 虛擬表和三個觸發器（insert/update/delete）。
新增 searchMessages(db, projectId, query, limit) 函式，使用 FTS5 MATCH 查詢，
JOIN messages 和 conversations 表，回傳含 snippet 的結果陣列。
注意：查詢字串需要清理特殊字元（"'*(）防止 FTS5 語法錯誤。
對已有資料的資料庫，在 FTS 表剛建立時（rowcount = 0）執行一次性索引重建。

### 2. apps/daemon/src/server.ts
新增路由 GET /api/projects/:id/search?q=<query>&limit=<n>。
q 長度 < 2 時回傳空陣列。limit 上限 50。
呼叫 searchMessages() 並回傳 { results: [...] }。

### 3. packages/contracts/src/index.ts（或對應的 contracts 檔案）
新增 MessageSearchResult 和 SearchMessagesResponse 型別。

### 4. apps/web/src/components/ChatPane.tsx
在對話列表頂部加入搜尋輸入框。
使用 300ms debounce 呼叫 /api/projects/:id/search。
搜尋結果顯示在對話列表上方，每筆結果顯示：角色、snippet（含 <mark> 高亮）、對話標題、時間。
點擊結果切換到對應對話並滾動到該訊息（用 data-message-id 屬性定位）。
搜尋框清空時恢復正常對話列表。

### 5. apps/web/src/i18n/locales/en.ts 和 zh-TW.ts
新增以下 i18n 鍵值：
- chat.searchPlaceholder: 'Search conversations…' / '搜尋對話…'
- chat.searchNoResults: 'No results for "{query}"' / '找不到「{query}」的結果'
- chat.searchResultRole.user: 'You' / '你'
- chat.searchResultRole.assistant: 'Agent' / 'Agent'

## 注意事項
- snippet() 函式的 HTML 輸出需要用 dangerouslySetInnerHTML 渲染，但 snippet 內容來自資料庫，不是使用者輸入，安全性可接受
- 搜尋 UI 的樣式沿用現有的 .composer-import-menu 風格
- 不要修改現有的 listMessages() 或 upsertMessage() 函式簽名

## 驗收條件
1. GET /api/projects/:id/search?q=hello 回傳含 snippet 的結果
2. 輸入特殊字元不造成 500 錯誤
3. 點擊搜尋結果可以跳轉到對應對話
4. pnpm typecheck 通過
5. pnpm test 通過
```

---

## F4 — 技能與設計系統 UI 安裝器

**預估工作量：** 4–6 天 | **詳細 spec：** `specs/current/f4-skill-design-system-installer.md`

```
你是 Open Design 專案的開發者。請根據 specs/current/f4-skill-design-system-installer.md 實作「技能與設計系統 UI 安裝器」功能。

## 任務概述
讓使用者可以從 Open Design 的「匯入」選單安裝外部 skill（git URL）或上傳 SKILL.md / DESIGN.md 檔案。

## 需要修改的檔案

### 1. apps/daemon/src/server.ts
新增以下端點：
- POST /api/skills/install — 從 git URL 安裝 skill
  - 只允許 https:// URL
  - repo 名稱只允許 [a-zA-Z0-9._-]，長度上限 64
  - 安裝到 ~/.claude/skills/<repo-name>/
  - 已存在時執行 git pull --ff-only，否則 git clone --depth=1
  - 安裝後重新掃描並回傳更新後的 skills 列表
  - git 超時 60 秒
- POST /api/skills/upload — 上傳 SKILL.md
  - 只接受 .md 檔案
  - 解析 frontmatter 取得 skill name
  - 安裝到 ~/.claude/skills/<name>/SKILL.md
- POST /api/design-systems/upload — 上傳 DESIGN.md
  - 安裝到 ~/.open-design/design-systems/<name>/DESIGN.md
- DELETE /api/skills/:id — 移除 skill
  - 只允許刪除 ~/.claude/skills/ 下的目錄（防止刪除內建 skill，回傳 403）

### 2. apps/web/src/components/ChatComposer.tsx
將「技能與設計系統」的 ImportItem 改為可互動的安裝面板：
- 兩個 tab：「Git URL」和「上傳檔案」
- Git URL tab：輸入框 + 安裝按鈕，Enter 也可觸發
- 上傳檔案 tab：隱藏的 file input，按鈕觸發，接受 .md 檔案
- 安裝中顯示 loading 狀態
- 安裝失敗顯示錯誤訊息

### 3. apps/web/src/i18n/locales/en.ts 和 zh-TW.ts
新增以下 i18n 鍵值：
- chat.importSkillsTabUrl: 'Git URL'
- chat.importSkillsTabUpload: 'Upload file' / '上傳檔案'
- chat.importSkillsInstall: 'Install' / '安裝'
- chat.importSkillsUploadFile: 'Choose SKILL.md or DESIGN.md' / '選擇 SKILL.md 或 DESIGN.md'
- chat.importSkillsUploadHint: (見 spec)
- chat.importSkillsInstalled: '"{name}" installed successfully.' / 「{name}」安裝成功。'
- chat.importSkillsInstallFailed: 'Installation failed: {error}' / '安裝失敗：{error}'

### 4. packages/contracts/src/index.ts
新增 InstallSkillRequest 和 InstallSkillResponse 型別。

## 注意事項
- git clone 使用 child_process.spawn，不要用 execFile
- 安裝目錄 ~/.claude/skills/ 需要 mkdir -p 確保存在
- 上傳的 .md 檔案用 parseFrontmatter() 解析（已在 frontmatter.ts 中）
- 安裝成功後需要觸發前端重新載入 skills 列表（呼叫現有的 GET /api/skills）

## 驗收條件
1. POST /api/skills/install 拒絕 http:// URL（400）
2. 上傳 SKILL.md 後 GET /api/skills 包含新 skill
3. DELETE /api/skills/built-in-skill 回傳 403
4. 前端安裝面板可以正常顯示和操作
5. pnpm typecheck 通過
6. pnpm test 通過
```

---

## F2 — Artifact 版本快照 / 復原

**預估工作量：** 5–7 天 | **詳細 spec：** `specs/current/f2-artifact-snapshots.md`

```
你是 Open Design 專案的開發者。請根據 specs/current/f2-artifact-snapshots.md 實作「Artifact 版本快照 / 復原」功能。

## 任務概述
在 open-design 專案中實作自動快照功能，讓使用者可以復原 agent 修改過的檔案。

## 需要修改的檔案

### 1. apps/daemon/src/projects.ts
新增以下函式：
- snapshotProjectFile(projectsRoot, projectId, name): 在 .snapshots/<name>/ 目錄建立時間戳快照
- pruneSnapshots(snapshotDir, maxCount): 保留最新 20 個，刪除舊的
- listSnapshots(projectsRoot, projectId, name): 回傳快照列表（最新在前）
- restoreSnapshot(projectsRoot, projectId, name, timestamp): 復原到指定快照（復原前先快照當前版本）

修改 writeProjectFile()：在 overwrite=true 且檔案已存在時，呼叫 snapshotProjectFile()（快照失敗不阻斷寫入，用 .catch(() => {})）。

快照路徑格式：.od/projects/<id>/.snapshots/<filename>/<timestamp><ext>
例如：.od/projects/abc123/.snapshots/index.html/1746432000000.html

### 2. apps/daemon/src/server.ts
新增三個端點：
- GET /api/projects/:id/files/*/snapshots — 列出快照
- GET /api/projects/:id/files/*/snapshots/:timestamp — 讀取快照內容（用於預覽）
- POST /api/projects/:id/files/*/snapshots/:timestamp/restore — 復原

注意：路由中的 * 是 Express 的萬用字元，用 req.params[0] 取得檔案路徑。

### 3. packages/contracts/src/index.ts
新增 SnapshotEntry、ListSnapshotsResponse、RestoreSnapshotResponse 型別。

### 4. apps/web/src/components/FileViewer.tsx
在工具列新增「版本歷史」按鈕（使用現有的 Icon 元件，name="clock" 或類似）。
點擊後在右側顯示快照列表側邊欄。
每筆快照顯示：相對時間、檔案大小、預覽按鈕、復原按鈕。
復原前顯示 confirm 對話框。
復原成功後重新載入檔案。

### 5. apps/web/src/i18n/locales/en.ts 和 zh-TW.ts
新增以下 i18n 鍵值：
- fileViewer.versionHistory: 'Version history' / '版本歷史'
- fileViewer.noSnapshots: 'No snapshots yet.' / '尚無快照。'
- fileViewer.restore: 'Restore' / '復原'
- fileViewer.restoreConfirm: 'Restore this version? The current file will be saved as a new snapshot.' / '復原到這個版本？目前的檔案會先儲存為新快照。'

## 注意事項
- .snapshots/ 目錄以 . 開頭，listFiles() 已自動排除，不需要額外處理
- 快照路徑中的 <filename> 可能包含子目錄（如 assets/logo.png），需要用 path.join 正確處理
- 復原端點需要驗證 timestamp 是有效的數字

## 驗收條件
1. agent 寫入 index.html 後，.snapshots/index.html/ 目錄出現對應快照
2. GET /api/projects/:id/files/index.html/snapshots 回傳快照列表
3. POST /restore 後 index.html 內容變更為快照版本
4. 快照超過 20 個時自動清理最舊的
5. pnpm typecheck 通過
6. pnpm test 通過
```

---

## F3 — 關聯程式碼目錄

**預估工作量：** 5–7 天 | **詳細 spec：** `specs/current/f3-linked-code-folder.md`

```
你是 Open Design 專案的開發者。請根據 specs/current/f3-linked-code-folder.md 實作「關聯程式碼目錄」功能。

## 任務概述
讓使用者可以在 Open Design 的「匯入」選單中指定本機目錄，讓 agent 在後續對話中可以讀取該目錄的檔案。

## 需要修改的檔案

### 1. apps/daemon/src/server.ts
新增兩個端點：
- POST /api/projects/:id/linked-dirs — 新增關聯目錄
  - 驗證 path 是絕對路徑、存在、是目錄（用 fs.stat）
  - 封鎖系統目錄：/etc, /sys, /proc, /dev, ~/.ssh（回傳 403）
  - 儲存到 project.metadata.linkedDirs 陣列（JSON 欄位，不需新增 DB 欄位）
  - 冪等（已存在時直接回傳）
  - 上限 3 個目錄，超過回傳 422 錯誤碼 too_many_linked_dirs
- DELETE /api/projects/:id/linked-dirs — 移除關聯目錄
  - 從 metadata.linkedDirs 中移除指定路徑

在 /api/chat 的 agent 呼叫邏輯中：
- 取得 project.metadata.linkedDirs
- 合併到 extraAllowedDirs 傳入 buildArgs()（和現有 skillDirs 合併，不是替換）
- 對不支援 --add-dir 的 agent，在 system prompt 末尾注入 <linked-directories> 區塊

### 2. apps/web/src/components/ChatComposer.tsx
將「關聯程式碼目錄」的 ImportItem 改為可互動的展開面板：
- 顯示已關聯的目錄列表（每個有刪除按鈕，路徑截斷至最後兩層）
- 輸入框讓使用者輸入新目錄路徑（Enter 或按鈕確認）
- 顯示已關聯數量的 badge
- Web 環境不支援 File System Access API 時，顯示提示訊息

新增 Props：linkedDirs, onLinkDir, onUnlinkDir

### 3. apps/web/src/i18n/locales/en.ts 和 zh-TW.ts
新增以下 i18n 鍵值：
- chat.importFolderPlaceholder: '/path/to/your/code'
- chat.importFolderLinked: '{n} folder(s) linked' / '已關聯 {n} 個資料夾'
- chat.importFolderEmpty: 'No folders linked yet.' / '尚未關聯任何資料夾。'

### 4. packages/contracts/src/index.ts
新增 LinkDirRequest 和 UnlinkDirRequest 型別。

## 注意事項
- linkedDirs 儲存在 project.metadata.linkedDirs（JSON 欄位），不需要新增資料庫欄位
- 路徑驗證使用 path.resolve() 正規化，不要用字串比較
- Topology C（daemon 離線）時，前端應隱藏此功能或顯示提示

## 驗收條件
1. POST /api/projects/:id/linked-dirs 新增有效目錄後，GET /api/projects/:id 的 metadata.linkedDirs 包含該路徑
2. 拒絕不存在的目錄（400）
3. 拒絕 /etc 等系統目錄（403）
4. 超過 3 個目錄時回傳 422
5. 關聯目錄後，下一次 /api/chat 的 agent 呼叫包含該目錄在 extraAllowedDirs 中
6. pnpm typecheck 通過
7. pnpm test 通過
```

---

## F5a — 匯入選單啟用框架

**預估工作量：** 2–3 天 | **詳細 spec：** `.kiro/specs/import-sources/requirements.md`（需求 1）

```
你是 Open Design 專案的開發者。請根據 .kiro/specs/import-sources/requirements.md 的「需求 1：匯入選單啟用框架」實作 Import Menu 的 UI 狀態管理框架。

## 任務概述
將 ChatComposer.tsx 中的 ImportItem 元件從純展示（全部 disabled）改為支援動態啟用狀態、載入指示器、錯誤顯示和無障礙標準的框架。

## 需要修改的檔案

### 1. apps/web/src/components/ChatComposer.tsx
重構 ImportItem 元件，支援以下 props：
- enabled: boolean — 是否啟用（false 時顯示「即將推出」）
- loading: boolean — 是否顯示載入指示器
- error: string | null — 錯誤訊息（顯示在項目旁）
- onRetry: () => void — 重試回呼
- onClick: () => void — 點擊回呼（只在 enabled=true 時有效）

無障礙要求：
- 下拉選單容器加 role="menu"
- 每個項目加 role="menuitem"
- 鍵盤導航：方向鍵在項目間移動，Enter/Space 觸發，Escape 關閉選單並將焦點返回觸發按鈕
- disabled 項目加 aria-disabled="true"

目前已實作的功能（F3、F4）設為 enabled=true，其餘保持 enabled=false。

### 2. apps/web/src/i18n/locales/en.ts 和 zh-TW.ts
確認以下鍵值存在（若已有則不重複新增）：
- chat.importComingSoon: 'Coming soon' / '即將推出'
- chat.importRetry: 'Retry' / '重試'

## 驗收條件
1. 已實作的匯入項目可以點擊，未實作的顯示「即將推出」
2. 點擊項目時顯示載入指示器
3. 發生錯誤時顯示錯誤訊息和重試按鈕
4. Escape 鍵關閉選單並返回焦點
5. 方向鍵可以在選單項目間導航
6. pnpm typecheck 通過
```

---

## F5b — 引用其它專案

**預估工作量：** 3–5 天 | **詳細 spec：** `.kiro/specs/import-sources/requirements.md`（需求 2、8）

```
你是 Open Design 專案的開發者。請根據 .kiro/specs/import-sources/requirements.md 的「需求 2：引用其它專案」和「需求 8：匯入來源持久化」實作專案引用功能。

## 任務概述
讓使用者可以在對話中引用另一個專案的 artifact，讓 agent 能夠參考先前的設計成果。

## 需要修改的檔案

### 1. apps/daemon/src/db.ts
新增 import_sources 表的 migration：
```sql
CREATE TABLE IF NOT EXISTS import_sources (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  type TEXT NOT NULL,
  config TEXT,
  created_at INTEGER NOT NULL
);
```
type 的有效值：project_ref, skill, linked_dir, github, figma, web_capture

### 2. apps/daemon/src/server.ts
新增以下端點：
- GET /api/projects/:id/files — 列出專案的所有 artifact 檔案路徑
- GET /api/projects/:id/import-sources — 列出已關聯的匯入來源
- POST /api/projects/:id/import-sources — 新增匯入來源（type=project_ref）
  - 驗證被引用的 project 存在，否則回傳 404 錯誤碼 project_not_found
  - 單一 Conversation 最多 5 個引用，超過回傳 422 錯誤碼 too_many_references
  - 在 import_sources 表插入記錄
- DELETE /api/projects/:id/import-sources/:sourceId — 移除匯入來源

在 agent 系統提示組裝時，讀取 import_sources 並注入被引用專案的名稱與檔案路徑。

修改 GET /api/projects/:id 回應，加入 importSourcesCount 欄位。

### 3. apps/web/src/components/ChatComposer.tsx
將「引用其它專案」的 ImportItem 改為可互動：
- 點擊後開啟專案選擇對話框
- 列出所有現有專案（依 updatedAt 降序），顯示名稱和最後更新時間
- 支援即時搜尋過濾（不需按 Enter）
- 選擇後在附件區域顯示被引用專案的名稱標籤（可移除）

### 4. packages/contracts/src/index.ts
新增 ImportSource、ImportSourceType、CreateImportSourceRequest 型別。

## 驗收條件
1. 選擇引用專案後，agent 系統提示包含被引用專案的名稱和檔案路徑
2. 超過 5 個引用時回傳 422
3. 被引用專案不存在時回傳 404
4. 附件區域顯示引用標籤，可以移除
5. pnpm typecheck 通過
6. pnpm test 通過
```

---

## F5c — 連線 GitHub

**預估工作量：** 8–10 天 | **詳細 spec：** `.kiro/specs/import-sources/requirements.md`（需求 5）

```
你是 Open Design 專案的開發者。請根據 .kiro/specs/import-sources/requirements.md 的「需求 5：連線 GitHub」實作 GitHub 連線功能。

## 任務概述
讓使用者可以連線 GitHub 儲存庫，讓 agent 讀取程式碼作為設計參考。

## 需要修改的檔案

### 1. apps/daemon/src/server.ts
新增以下端點：
- POST /api/github/auth — 驗證 GitHub PAT
  - 呼叫 GET https://api.github.com/user 驗證 Token
  - 驗證失敗（401）回傳 422 錯誤碼 github_auth_failed
  - 驗證成功後用 AES-256-GCM 加密儲存 Token（不存明文）
  - 連線逾時 10 秒，讀取逾時 30 秒
- GET /api/github/repos — 列出最近存取的儲存庫（需要已驗證的 PAT）
- GET /api/github/repos/:owner/:repo/tree — 取得儲存庫目錄結構
- POST /api/projects/:id/import-sources（type=github）— 下載選定的 GitHub 檔案
  - 下載到 .od/projects/<id>/github-<owner>-<repo>/
  - 上限：200 個檔案、10 MB 總大小
  - 超過限制回傳 422 錯誤碼 github_download_limit_exceeded
  - 支援 GitHub API 速率限制（429 或 X-RateLimit-Remaining: 0）回傳 429 錯誤碼 github_rate_limited

### 2. apps/web/src/components/ChatComposer.tsx
將「連線 GitHub」的 ImportItem 改為可互動的多步驟流程：
1. 步驟一：PAT 輸入（或 OAuth 按鈕，OAuth 可先留 placeholder）
2. 步驟二：儲存庫選擇（輸入 owner/repo 或從清單選擇）
3. 步驟三：目錄/檔案選擇（樹狀結構，可多選）
4. 確認下載，顯示進度

### 3. apps/web/src/i18n/locales/en.ts 和 zh-TW.ts
新增 GitHub 連線相關的 i18n 鍵值（PAT 輸入、儲存庫選擇、下載進度等）。

### 4. packages/contracts/src/index.ts
新增 GitHubAuthRequest、GitHubRepoFile、GitHubImportConfig 型別。

## 安全注意事項
- GitHub PAT 必須用 AES-256-GCM 加密後儲存，不能存明文
- 查看已儲存 PAT 時只顯示遮罩值（****...****<last4>）
- 所有外部 HTTP 請求設定連線逾時 10 秒、讀取逾時 30 秒

## 驗收條件
1. 輸入有效 PAT 後可以看到儲存庫列表
2. 無效 PAT 回傳 422 且不儲存
3. 下載超過 200 個檔案時回傳 422
4. 下載完成後 agent 系統提示包含 GitHub 來源資訊
5. pnpm typecheck 通過
6. pnpm test 通過
```

---

## 完成後的 Git 推送指令

每個功能完成後，建立 feature branch 並推送到個人 fork：

```bash
# 建立 feature branch（在 open-design 目錄執行）
git checkout -b feature/f1-conversation-search
git add -p
git commit -m "feat(search): add FTS5 conversation search"
git push fork feature/f1-conversation-search --force-with-lease

# 下一個功能
git checkout i18n/zh-tw-ui-dict
git checkout -b feature/f4-skill-installer
# ... 以此類推
```

**注意：** 永遠不要直接推送到 `origin`（nexu-io/open-design）。
