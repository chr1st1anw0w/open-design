# 需求文件：匯入來源（Import Sources）

## 簡介

Open Design 的「匯入」下拉選單（`ChatComposer` 中的 `ImportItem` 元件）目前有六個項目，全部標示為「即將推出」，後端邏輯尚未實作。本功能規格涵蓋這六個匯入管道的完整實作，讓使用者能夠將外部設計資源、程式碼、網頁元素及其他專案引入 agent 的工作情境，以提升設計生成品質。

六個功能依實作複雜度與 ROI 分為三批：
- **批次一（快速交付）**：引用其它專案、技能與設計系統
- **批次二**：關聯程式碼目錄、連線 GitHub
- **批次三**：上傳 .fig 檔案、擷取網頁元素

---

## 詞彙表

- **Import_Menu**：`ChatComposer` 中的「匯入」下拉選單，包含六個 `ImportItem` 按鈕。
- **Daemon**：`apps/daemon` 中的本地特權後端服務，負責 `/api/*` 端點、agent 執行、技能與設計系統掃描、SQLite 儲存及檔案系統操作。
- **Agent**：由 Daemon 啟動的 AI 程序（Claude Code、Codex 等），在專案工作目錄中執行設計生成任務。
- **Project**：以 `id`（UUID）識別的設計工作單元，對應 `.od/projects/<id>/` 目錄及 SQLite 中的 `projects` 表列。
- **Conversation**：隸屬於 Project 的對話執行緒，包含多輪 Agent 互動訊息。
- **Context_Attachment**：附加至 Conversation 的外部資源參照，Agent 可在生成時讀取其內容。
- **Skill**：位於 `<projectRoot>/skills/<name>/SKILL.md` 的技能定義檔，由 `skills.ts` 掃描並提供給 Agent。
- **Design_System**：位於 `<projectRoot>/design-systems/<name>/DESIGN.md` 的設計系統定義檔，由 `design-systems.ts` 掃描。
- **Linked_Dir**：使用者指定的本機程式碼目錄，透過 Daemon 的路徑管理機制讓 Agent 可讀取。
- **Figma_API**：Figma 官方 REST API（`https://api.figma.com/v1/`），需要 Personal Access Token（PAT）進行認證。
- **GitHub_API**：GitHub REST API（`https://api.github.com/`），支援 OAuth App 或 Personal Access Token 認證。
- **Headless_Browser**：Daemon 中已用於 PDF 匯出的 Puppeteer/Playwright 執行環境，可重用於網頁擷取。
- **PAT**：Personal Access Token，用於 Figma 或 GitHub API 認證的使用者憑證。
- **SSRF**：Server-Side Request Forgery，需防範 Daemon 被誘導存取內部網路資源。
- **resolveSafe**：`projects.ts` 中的路徑安全函式，防止路徑穿越攻擊。
- **Import_Source_Record**：SQLite 中記錄匯入來源設定的資料列，包含類型、設定及關聯的 Project ID。

---

## 需求

### 需求 1：匯入選單啟用框架

**使用者故事：** 身為使用者，我希望「匯入」下拉選單中的項目在功能就緒後能夠點擊，而非永遠顯示「即將推出」，以便我能實際使用這些功能。

#### 驗收標準

1. THE Import_Menu SHALL 為每個已實作的匯入功能渲染一個可點擊的按鈕，移除該項目的 `disabled` 屬性與「即將推出」標籤。
2. WHEN 使用者點擊已實作的匯入項目，THE Import_Menu SHALL 關閉下拉選單並開啟對應的匯入流程 UI（對話框或面板）。
3. WHILE 匯入流程正在進行，THE Import_Menu SHALL 在觸發按鈕上顯示載入指示器。
4. IF 匯入流程發生錯誤，THEN THE Import_Menu SHALL 在對應的匯入項目旁顯示錯誤訊息，並提供重試選項。
5. THE Import_Menu SHALL 對尚未實作的匯入項目保留 `disabled` 狀態與「即將推出」標籤，直到該功能完成實作。
6. WHEN 使用者按下 `Escape` 鍵，THE Import_Menu SHALL 關閉下拉選單並將焦點返回觸發按鈕。
7. THE Import_Menu SHALL 符合 WCAG 2.1 AA 無障礙標準，包含正確的 `role="menu"`、`role="menuitem"`、鍵盤導航（方向鍵）及焦點管理。

---

### 需求 2：引用其它專案（Reference Another Project）

**使用者故事：** 身為使用者，我希望在新對話中引用另一個專案的產出物作為設計參考，以便 Agent 能夠延續或參考先前的設計成果。

#### 驗收標準

1. WHEN 使用者點擊「引用其它專案」，THE Import_Menu SHALL 開啟一個專案選擇對話框，列出所有現有 Project 的名稱、最後更新時間及縮圖預覽（若有）。
2. THE Project_Picker SHALL 依 `updatedAt` 降序排列專案清單，最近更新的排在最前。
3. WHEN 使用者選擇一個 Project，THE Daemon SHALL 將該 Project 的 `.od/projects/<id>/` 目錄中的所有 artifact 檔案路徑列表附加至當前 Conversation 的 Context_Attachment。
4. THE Daemon SHALL 透過 `GET /api/projects/:id/files` 端點提供被引用專案的檔案清單，並在 Agent 系統提示中注入被引用專案的名稱與檔案路徑。
5. IF 被引用的 Project 不存在或已被刪除，THEN THE Daemon SHALL 回傳 HTTP 404 並附帶錯誤碼 `project_not_found`。
6. THE Project_Picker SHALL 允許使用者搜尋專案名稱，搜尋為即時過濾（不需按 Enter）。
7. WHEN 引用成功，THE Import_Menu SHALL 在 ChatComposer 的附件區域顯示被引用專案的名稱標籤，讓使用者確認引用已生效。
8. THE Daemon SHALL 限制單一 Conversation 最多引用 5 個外部 Project，超過時回傳 HTTP 422 並附帶錯誤碼 `too_many_references`。

---

### 需求 3：技能與設計系統安裝器（Skills & Design Systems Installer）

**使用者故事：** 身為使用者，我希望透過 UI 輸入 Git URL 或上傳檔案來安裝外部技能或設計系統，而不需要手動操作 CLI，以便我能輕鬆擴充 Agent 的設計能力。

#### 驗收標準

1. WHEN 使用者點擊「技能與設計系統」，THE Import_Menu SHALL 開啟一個安裝器對話框，提供兩個輸入方式：Git URL 輸入欄位及檔案上傳區域（接受 `.md` 檔案）。
2. WHEN 使用者輸入有效的 Git URL 並確認，THE Daemon SHALL 執行 `git clone <url>` 至 `<projectRoot>/skills/<repo-name>/` 或 `<projectRoot>/design-systems/<repo-name>/`，依目標目錄中是否存在 `SKILL.md` 或 `DESIGN.md` 自動判斷類型。
3. WHEN `git clone` 完成，THE Daemon SHALL 重新執行 `listSkills()` 或 `listDesignSystems()` 掃描，並透過 SSE 事件通知前端安裝結果。
4. IF `git clone` 失敗（網路錯誤、無效 URL、認證失敗），THEN THE Daemon SHALL 回傳 HTTP 422 並附帶錯誤碼 `git_clone_failed` 及原始錯誤訊息（已脫敏）。
5. WHEN 使用者上傳 `.md` 檔案，THE Daemon SHALL 驗證檔案包含有效的 YAML frontmatter，並將其儲存至對應目錄（`skills/` 或 `design-systems/`），依 frontmatter 中的 `name` 欄位命名子目錄。
6. IF 上傳的 `.md` 檔案缺少必要的 frontmatter 欄位（`name`、`description`），THEN THE Daemon SHALL 回傳 HTTP 422 並附帶錯誤碼 `invalid_skill_frontmatter`。
7. THE Daemon SHALL 限制 Git URL 只能為 `https://` 協定，拒絕 `file://`、`ssh://` 及其他協定，回傳 HTTP 422 並附帶錯誤碼 `invalid_git_protocol`。
8. WHEN 安裝成功，THE Import_Menu SHALL 在 ChatComposer 的附件區域顯示已安裝的技能或設計系統名稱標籤，並自動將其套用至當前 Conversation。
9. THE Installer_Dialog SHALL 顯示安裝進度（`cloning`、`scanning`、`done`）及預估剩餘時間（以秒為單位）。
10. THE Daemon SHALL 在執行 `git clone` 前驗證目標目錄不存在同名子目錄，若已存在則回傳 HTTP 409 並附帶錯誤碼 `skill_already_exists`。

---

### 需求 4：關聯程式碼目錄（Link Code Directory）

**使用者故事：** 身為使用者，我希望指定本機的程式碼目錄讓 Agent 讀取，以便 Agent 能夠參考現有的元件庫或設計稿進行設計生成。

#### 驗收標準

1. WHEN 使用者點擊「關聯程式碼目錄」，THE Import_Menu SHALL 開啟系統原生的目錄選擇器（Electron 環境使用 `dialog.showOpenDialog`；Web 環境使用 File System Access API 的 `showDirectoryPicker`）。
2. WHEN 使用者選擇目錄，THE Daemon SHALL 驗證所選路徑為絕對路徑且存在於本機檔案系統，並將其記錄至 SQLite 的 `import_sources` 表中，關聯至當前 Project。
3. THE Daemon SHALL 使用 `resolveSafe()` 函式驗證所選路徑不包含路徑穿越序列（`../`、symlink 跳脫等），若驗證失敗則回傳 HTTP 422 並附帶錯誤碼 `unsafe_path`。
4. WHEN 目錄關聯成功，THE Daemon SHALL 掃描目錄中的所有文字檔案（`.ts`、`.tsx`、`.js`、`.jsx`、`.css`、`.html`、`.md`），建立檔案索引並注入 Agent 系統提示，說明可讀取的目錄路徑。
5. THE Daemon SHALL 限制掃描深度為 5 層目錄，且單一關聯目錄的索引檔案數量上限為 500 個，超過時截斷並在系統提示中標注。
6. IF 所選目錄不存在或無讀取權限，THEN THE Daemon SHALL 回傳 HTTP 422 並附帶錯誤碼 `directory_not_accessible`。
7. WHERE Web 環境不支援 File System Access API，THE Import_Menu SHALL 顯示提示訊息，說明此功能需要 Electron 桌面版或支援 File System Access API 的瀏覽器。
8. WHEN 目錄關聯成功，THE Import_Menu SHALL 在 ChatComposer 的附件區域顯示目錄路徑標籤（截斷至最後兩層路徑），讓使用者確認關聯已生效。
9. THE Daemon SHALL 允許單一 Project 最多關聯 3 個程式碼目錄，超過時回傳 HTTP 422 並附帶錯誤碼 `too_many_linked_dirs`。
10. WHEN 使用者移除已關聯的目錄，THE Daemon SHALL 從 SQLite 刪除對應的 `import_sources` 記錄，並從 Agent 系統提示中移除該目錄的參照。

---

### 需求 5：連線 GitHub（Connect GitHub）

**使用者故事：** 身為使用者，我希望連線 GitHub 儲存庫讓 Agent 讀取程式碼作為設計參考，以便 Agent 能夠理解現有的前端元件結構並生成一致的設計。

#### 驗收標準

1. WHEN 使用者點擊「連線 GitHub」，THE Import_Menu SHALL 開啟 GitHub 連線對話框，提供兩種認證方式：Personal Access Token（PAT）輸入欄位及 OAuth App 授權按鈕。
2. WHEN 使用者輸入有效的 GitHub PAT，THE Daemon SHALL 呼叫 `GET https://api.github.com/user` 驗證 Token 有效性，並將 Token 加密儲存至 Daemon 的設定檔（不儲存於 SQLite 明文欄位）。
3. IF GitHub PAT 驗證失敗（HTTP 401），THEN THE Daemon SHALL 回傳 HTTP 422 並附帶錯誤碼 `github_auth_failed`，不儲存無效 Token。
4. WHEN GitHub 認證成功，THE GitHub_Connector SHALL 顯示儲存庫選擇器，允許使用者輸入 `owner/repo` 格式的儲存庫名稱或從最近存取的儲存庫清單中選擇。
5. WHEN 使用者選擇儲存庫，THE Daemon SHALL 呼叫 `GET https://api.github.com/repos/:owner/:repo/contents/` 取得根目錄結構，並允許使用者選擇要下載的子目錄或特定檔案。
6. THE Daemon SHALL 將選定的檔案下載至 `.od/projects/<id>/github-<owner>-<repo>/`，並限制單次下載的檔案數量上限為 200 個、總大小上限為 10 MB。
7. IF 下載超過檔案數量或大小限制，THEN THE Daemon SHALL 回傳 HTTP 422 並附帶錯誤碼 `github_download_limit_exceeded`，說明實際數量與限制值。
8. WHEN 下載完成，THE Daemon SHALL 將下載的檔案路徑注入 Agent 系統提示，說明可參考的 GitHub 儲存庫來源及本機快取路徑。
9. THE Daemon SHALL 在 Agent 系統提示中標注 GitHub 內容的來源儲存庫、分支及下載時間戳記，讓 Agent 能夠正確引用來源。
10. THE Daemon SHALL 支援 GitHub API 速率限制處理：當收到 HTTP 429 或 `X-RateLimit-Remaining: 0` 時，回傳 HTTP 429 並附帶錯誤碼 `github_rate_limited` 及 `retry_after` 秒數。
11. THE GitHub_Connector SHALL 允許使用者在 SettingsDialog 中管理已儲存的 GitHub 認證，包含查看已連線帳號及撤銷授權。

---

### 需求 6：上傳 .fig 檔案（Upload Figma File）

**使用者故事：** 身為使用者，我希望上傳 Figma 設計檔案讓 Agent 讀取設計規格，以便 Agent 能夠根據 Figma 設計稿生成對應的 HTML/CSS 實作。

#### 驗收標準

1. WHEN 使用者點擊「上傳 .fig 檔案」，THE Import_Menu SHALL 開啟 Figma 匯入對話框，提供兩種輸入方式：Figma 檔案 URL 輸入欄位（格式：`https://www.figma.com/file/:key/...`）及 Figma PAT 設定入口。
2. WHEN 使用者輸入有效的 Figma 檔案 URL，THE Daemon SHALL 解析 URL 中的 `:key` 參數，並呼叫 `GET https://api.figma.com/v1/files/:key` 取得 Figma JSON 設計資料。
3. THE Daemon SHALL 要求使用者在 SettingsDialog 中預先設定 Figma PAT，若未設定則顯示引導訊息並開啟設定頁面，回傳 HTTP 422 並附帶錯誤碼 `figma_pat_not_configured`。
4. IF Figma API 回傳 HTTP 403，THEN THE Daemon SHALL 回傳 HTTP 422 並附帶錯誤碼 `figma_access_denied`，提示使用者確認 PAT 權限包含 `files:read`。
5. IF Figma API 回傳 HTTP 404，THEN THE Daemon SHALL 回傳 HTTP 422 並附帶錯誤碼 `figma_file_not_found`，提示使用者確認檔案 URL 正確且有存取權限。
6. WHEN Figma JSON 取得成功，THE Daemon SHALL 將 Figma JSON 轉換為結構化的設計規格摘要（包含頁面名稱、元件清單、顏色樣式、文字樣式及主要框架尺寸），並儲存至 `.od/projects/<id>/figma-<key>.json`。
7. THE Daemon SHALL 限制 Figma JSON 回應大小上限為 50 MB，超過時截斷並在設計規格摘要中標注。
8. WHEN 轉換完成，THE Daemon SHALL 將設計規格摘要注入 Agent 系統提示，讓 Agent 能夠參考 Figma 設計規格進行生成。
9. THE Figma_Importer SHALL 在 SettingsDialog 中提供 Figma PAT 的設定介面，包含 PAT 輸入欄位、有效性驗證按鈕及遮罩顯示（僅顯示最後 4 碼）。
10. THE Daemon SHALL 快取 Figma JSON 至本機，在 24 小時內重複匯入相同 `:key` 時直接使用快取，不重複呼叫 Figma API。

---

### 需求 7：擷取網頁元素（Capture Web Element）

**使用者故事：** 身為使用者，我希望輸入網頁 URL 讓系統擷取該頁面的視覺外觀與 DOM 結構，以便 Agent 能夠參考現有網頁的設計風格進行重製或改良。

#### 驗收標準

1. WHEN 使用者點擊「擷取網頁元素」，THE Import_Menu SHALL 開啟網頁擷取對話框，提供 URL 輸入欄位（需為 `https://` 協定）及擷取選項（全頁截圖、可見區域截圖、僅 DOM 結構）。
2. WHEN 使用者輸入有效的 HTTPS URL 並確認，THE Daemon SHALL 使用現有的 Puppeteer/Playwright 執行環境啟動 Headless_Browser，導航至目標 URL 並擷取截圖及 DOM 結構。
3. THE Daemon SHALL 在啟動 Headless_Browser 前驗證目標 URL 不屬於私有 IP 範圍（`10.0.0.0/8`、`172.16.0.0/12`、`192.168.0.0/16`、`127.0.0.0/8`、`::1`），若驗證失敗則回傳 HTTP 422 並附帶錯誤碼 `ssrf_blocked`。
4. THE Daemon SHALL 設定 Headless_Browser 的導航逾時為 30 秒，若超時則回傳 HTTP 422 並附帶錯誤碼 `capture_timeout`。
5. WHEN 擷取成功，THE Daemon SHALL 將截圖儲存為 PNG 格式至 `.od/projects/<id>/web-capture-<timestamp>.png`，並將精簡後的 DOM 結構（移除 `<script>`、`<style>` 標籤，保留語義化 HTML 結構）儲存為 `.od/projects/<id>/web-capture-<timestamp>.html`。
6. THE Daemon SHALL 限制截圖解析度上限為 1920×1080 像素，並將 PNG 檔案大小壓縮至 5 MB 以內。
7. THE Daemon SHALL 從擷取的 DOM 中提取 CSS 自訂屬性（`--*`）及主要顏色值，生成設計 token 摘要並附加至 Agent 系統提示。
8. IF 目標 URL 回傳 HTTP 4xx 或 5xx，THEN THE Daemon SHALL 回傳 HTTP 422 並附帶錯誤碼 `capture_http_error` 及原始 HTTP 狀態碼。
9. THE Daemon SHALL 在 Headless_Browser 中停用 JavaScript 執行（`page.setJavaScriptEnabled(false)`）作為預設安全設定，並提供「啟用 JavaScript」選項讓使用者明確選擇。
10. WHEN 擷取完成，THE Import_Menu SHALL 在 ChatComposer 的附件區域顯示截圖縮圖及來源 URL 標籤，讓使用者確認擷取結果。
11. THE Daemon SHALL 限制單一 Project 的網頁擷取記錄上限為 10 筆，超過時自動刪除最舊的記錄及對應檔案。

---

### 需求 8：匯入來源的持久化與管理

**使用者故事：** 身為使用者，我希望已設定的匯入來源能夠在對話之間持久保存，並能夠在 UI 中查看與移除已關聯的來源，以便我能管理 Agent 的工作情境。

#### 驗收標準

1. THE Daemon SHALL 在 SQLite 資料庫中建立 `import_sources` 表，包含欄位：`id`（TEXT PRIMARY KEY）、`project_id`（TEXT NOT NULL）、`type`（TEXT NOT NULL，值為 `project_ref`、`skill`、`linked_dir`、`github`、`figma`、`web_capture`）、`config`（TEXT，JSON 格式）、`created_at`（INTEGER）。
2. WHEN 任何匯入來源成功建立，THE Daemon SHALL 在 `import_sources` 表中插入對應記錄，並透過 `GET /api/projects/:id/import-sources` 端點提供查詢。
3. THE Daemon SHALL 在 Agent 系統提示組裝時，自動讀取當前 Project 的所有 `import_sources` 記錄，並將各來源的情境資訊注入提示。
4. WHEN 使用者在 ChatComposer 的附件區域點擊移除按鈕，THE Daemon SHALL 呼叫 `DELETE /api/projects/:id/import-sources/:sourceId` 刪除對應記錄，並從 Agent 系統提示中移除該來源。
5. IF `import_sources` 表不存在（舊版資料庫），THEN THE Daemon SHALL 在啟動時自動執行 migration 建立該表，不影響現有資料。
6. THE Daemon SHALL 在 `GET /api/projects/:id` 回應中包含 `importSourcesCount` 欄位，讓前端能夠顯示已關聯來源的數量徽章。
7. WHEN Project 被刪除，THE Daemon SHALL 級聯刪除該 Project 的所有 `import_sources` 記錄及對應的本機快取檔案。

---

### 需求 9：匯入來源的安全性與速率限制

**使用者故事：** 身為系統，我需要確保所有匯入管道都有適當的安全防護，防止惡意輸入、SSRF 攻擊及資源濫用。

#### 驗收標準

1. THE Daemon SHALL 對所有匯入端點（`POST /api/import/*`）套用 Zod schema 驗證，拒絕不符合 schema 的請求並回傳 HTTP 400 及錯誤碼 `validation_error`。
2. THE Daemon SHALL 對所有外部 HTTP 請求（Figma API、GitHub API、網頁擷取）設定連線逾時為 10 秒、讀取逾時為 30 秒。
3. THE Daemon SHALL 在所有匯入端點上套用速率限制：每個 Project 每分鐘最多 10 次匯入請求，超過時回傳 HTTP 429 並附帶錯誤碼 `rate_limited`。
4. THE Daemon SHALL 對儲存至本機的所有匯入檔案使用 `resolveSafe()` 驗證目標路徑，確保所有寫入操作限制在 `.od/projects/<id>/` 目錄內。
5. IF 任何匯入操作的外部請求回傳包含敏感資訊的錯誤（如 Token 值、內部 IP），THEN THE Daemon SHALL 在記錄日誌前脫敏處理，不將原始錯誤訊息回傳至前端。
6. THE Daemon SHALL 對 GitHub PAT 及 Figma PAT 使用 AES-256-GCM 加密後儲存至 Daemon 設定檔，不以明文形式儲存於 SQLite 或任何日誌中。
7. WHEN 使用者在 SettingsDialog 中查看已儲存的 PAT，THE Daemon SHALL 僅顯示遮罩值（`****...****<last4>`），不回傳完整 Token 值。
