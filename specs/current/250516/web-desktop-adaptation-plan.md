# Web 適配 Open Design macOS 桌面版開發計劃

建立日期：2026-05-16  
最後更新：2026-05-16（新增 Phase J：c1 全局 AI 助理整合；移除 Parallel-Dev Guardrail）  
狀態：In Progress（Goal Mode；已完成 Phase C/F/G/H，正在執行 Phase 0/A/B/D/E；Phase J 為當前最高優先級）  
目標路徑：`/Users/christianwu/open-design/specs/current/250516/web-desktop-adaptation-plan.md`

## 最新執行狀態（2026-05-16）

- Phase 0：已完成環境盤點（desktop data root / skills / projects / app.sqlite / MCP+Composio config 實檔確認）與 fixture 建立（`/tmp/od-shared-project-fixture`）。
- Phase A：已部分完成。
  - 已完成：`/api/import/folder` 回傳 `resolvedDir`；Web manual folder import 已顯示 in-place edit 文案；匯入錯誤改為結構化訊息回饋。
  - 測試：`apps/daemon/tests/folder-import-route.test.ts` 全數通過（含新增案例）。
- Phase B：已部分完成。
  - 已完成：新增 `POST /api/projects/path-backed`（`use-existing` / `create-if-empty`）、共用 `baseDir` 驗證 helper、Web 新專案面板新增 path-backed 欄位與建立入口。
  - 待完成：web 端 typecheck 還有 contracts 匯出型別對齊問題（見下方「當前阻塞」）。
- Phase D：已部分完成。
  - 已完成：daemon 單一技能同步引擎（manifest-managed、dry-run、atomic copy、managed-only delete）。
  - 已完成：`tools-dev` 新增 `sync desktop-skills` 命令，透過 daemon API 執行。
- Phase E：已部分完成。
  - 已完成：新增 `POST /api/skills/sync-desktop`；Library Skills 頁面新增 `Sync Desktop`（dry-run 預覽 + confirm apply）。
  - 測試：`apps/daemon/tests/skills-sync-route.test.ts` 通過。

### 當前阻塞（待修復）

- Web typecheck 目前卡在 contracts 匯出型別對齊：
  - `SkillDesktopSyncResponse`
  - `CreatePathBackedProjectRequest`
  - `CreatePathBackedProjectResponse`
- 這是型別匯出可見性問題（非功能邏輯失敗），修復後可繼續完成 Phase B/E 收尾與整體驗證。

## Objective

讓 `apps/web` 能安全地接上 Open Design macOS 桌面版的本機資料、技能、設計系統與設定資源，優先完成以下可驗證能力：

1. **專案共享**：Web 版本可讀取並編輯桌面版或本機既有專案資料夾；第一階段先支援「指定專案資料夾匯入」，後續支援「Web 新增專案時指定讀寫路徑」。
2. **技能共享**：將 `/Users/christianwu/open-design/skills` 以可重複執行、可回滾、避免誤刪使用者技能的方式同步到桌面版技能資料夾：
   `/Users/christianwu/Library/Application Support/Open Design/namespaces/release-stable-intel/data/skills`
3. **MCP 設定共享**：在 Web 端 Settings 彈窗的「MCP」頁面右上角新增 `Sync Desktop`，支援從桌面版 profile 同步/匯入 MCP 設定。
4. **Composio 連接器共享**：在 Web 端 Settings 彈窗的「連接器」頁面右上角新增 `Sync Desktop`，支援同步/匯入桌面版 Composio connector 設定。
5. **技能重新掃描**：在 Web 端「技能與設計系統」設定的「技能」頁面新增「重新掃描」，確保 Web 端技能目錄以 `/Users/christianwu/open-design/skills` 作為預設可用來源。
6. **設計系統預設目錄**：將目前 Open Design 的 design system 統一整合到 `/Users/christianwu/open-design/design-systems`，並將其作為 Web/daemon 預設設計系統目錄。
7. **設計系統重新掃描**：在 Web 端「技能與設計系統」設定的「設計系統」頁面，於「+ 安裝」旁新增「重新掃描」，讓 Web 端可立即使用 `/Users/christianwu/open-design/design-systems` 底下的設計系統。

## Context

### 現有架構判斷

- `apps/web` 是 UI/UX 層，透過 `/api/*` 呼叫 daemon；不應直接碰 SQLite 或 OS filesystem。
- `apps/daemon` 是本機權限邊界，擁有 SQLite、專案檔案 I/O、技能掃描、安裝與 static asset serving。
- `packages/contracts` 是 Web/Daemon API DTO 邊界；新增專案路徑、同步結果、錯誤形狀應先在 contracts 定義。
- `apps/packaged` 的 namespace data root 形狀為：
  `<namespaceRoot>/data`，macOS release 目標目前對應：
  `/Users/christianwu/Library/Application Support/Open Design/namespaces/release-stable-intel/data`
- 既有 folder import 基礎已存在：
  - `ProjectMetadata.baseDir`
  - `POST /api/import/folder`
  - `resolveProjectDir(projectsRoot, projectId, metadata)`
  - Web 的 `importFolderProject(...)`
  - Electron 的 `pickAndImport` + HMAC token gate
- 目前 daemon 已有 repo bundled resources 與 runtime user resources 的分層概念；技能與設計系統應維持「repo 預設目錄可掃描、runtime 安裝目錄可同步」的分界。
- MCP、Composio 連接器設定都屬於高敏感設定；計劃階段只定義 profile-level 匯入與同步流程，實作時需先盤點確切檔案、token store、secret 欄位與遮罩策略。

### 安全與產品邊界

- 不建議讓 Web renderer 直接讀寫桌面版 SQLite；必須走 daemon API。
- 不建議兩個 daemon 同時以讀寫模式開同一個桌面版 `app.sqlite`；共享桌面 profile 時需採「連到同一 daemon」或「明確提示停止桌面 app 後才切換 OD_DATA_DIR」。
- 指定資料夾匯入應維持現有安全模型：realpath canonicalization、拒絕匯入當前 daemon data dir、路徑穿越防護、folder import 才能設定 `metadata.baseDir`。
- 技能同步不可直接 `rm -rf target && cp -R source target`；需要 managed manifest，避免刪除使用者在桌面版安裝的技能。

## Scope

### In Scope

- Web 端新增/改善「指定資料夾匯入」入口與狀態回饋。
- Daemon 端補足 path-backed project 的 API contract、驗證與測試。
- Web 新增專案時允許指定讀寫路徑，但仍由 daemon 建立與管理 metadata。
- 建立技能同步工具，將 repo `skills/` 同步到桌面版 release namespace 的 `data/skills`。
- 在 Settings 的 MCP 與連接器頁面新增 desktop sync/import 入口。
- 在技能與設計系統設定頁新增 skills/design-systems 重新掃描入口。
- 將 repo `design-systems/` 作為 Web/daemon 預設 design-system source，並規劃既有 design system 整合。
- 建立驗證指令與手動 QA 路徑。

### Out of Scope

- 不在此階段重構整個專案資料庫模型。
- 不在此階段實作 cloud/Vercel 遠端 daemon bridge。
- 不在此階段做技能 marketplace 或版本解析 UI。
- 不在此階段允許 Web 直接操作 macOS Finder picker；Electron picker 仍由 desktop main process 持有。
- 不在此階段自動覆蓋 MCP token、Composio credential 或任意 secret；同步前必須有 diff/preview 與安全遮罩。
- 不在此階段移除桌面版 profile 裡使用者自行安裝的 MCP server、connector、skill 或 design system。

## c1 全局 AI 助理整合（最高優先級）

> 2026-05-16 更新：取消先前的 Parallel-Dev Guardrail。c1 助理已收斂到 `apps/web/src/components/assistant/**`（`AssistantProvider`、`AssistantFab`、`AssistantSidebar`），並已掛載到 App root。下一步是把 c1 完整整合進工作介面，作為跨頁面的 AI 全局助理。

### 整合目標

1. c1 助理在 Web/Desktop 任何頁面都可由 `AssistantFab` 喚出，作為單一 AI 入口。
2. 助理透過 daemon `/api/c1/assistant` 取得回應，避免 Web renderer 直接持有 Thesys/Claude API token。
3. 助理可讀取目前 Active Project / Active File / 選取技能 / 設計系統作為 context（沿用 `assistant-context.ts`）。
4. legacy ↔ c1 切換仍由 `feature-flags.ts` 控制，但預設模式改為 `c1`。
5. Settings、Library、EntryView 等主畫面元件可主動 push 上下文到助理（例如「請改善這個檔案」）。

### 已收斂的整合點（不再視為鎖定區）

- `apps/web/src/App.tsx`：助理 Provider + Fab + Sidebar 已掛載。
- `apps/web/src/lib/feature-flags.ts`：`ChatUIMode = legacy | c1`。
- `apps/web/src/components/assistant/**`：助理 UI 主體。
- `apps/web/src/components/chat-c1/**`、`ChatPaneC1.tsx`：c1 渲染與 customComponents。

後續所有 c1 變更直接走一般 PR 流程；不再需要避碰排程。

## Proposed Architecture

### Track A：指定專案資料夾匯入

沿用既有 `POST /api/import/folder`，將任意絕對路徑匯入成 folder-backed project。

```text
Web UI
  -> state/projects.importFolderProject({ baseDir, name?, skillId?, designSystemId? })
  -> POST /api/import/folder
  -> daemon realpath + directory validation
  -> insertProject(metadata.baseDir = canonicalPath)
  -> file APIs call resolveProjectDir(...)
  -> Web 編輯檔案時直接寫入該資料夾
```

此路線適合優先滿足「讀取且編輯桌面版專案資料夾」：如果桌面專案本身是使用者指定的外部資料夾，Web 匯入後即可共用同一組檔案。

### Track B：Web 新增專案讀取路徑

新增「Create path-backed project」能力，與一般 `POST /api/projects` 分流，避免破壞目前禁止 client 直接帶 `metadata.baseDir` 的安全規則。

```text
POST /api/projects/path-backed
body:
  name
  baseDir
  createMode: "use-existing" | "create-if-empty"
  skillId?
  designSystemId?
  pendingPrompt?
  metadata without baseDir/fromTrustedPicker

daemon:
  validate baseDir with same folder-import guard
  optionally mkdir when create-if-empty
  reject non-empty folder if mode requires empty
  insert project with metadata.baseDir
  create default conversation
  optionally seed entry file/template
```

保留既有 `POST /api/projects` 禁止 `baseDir` 的規則，讓所有 filesystem-root 專案都集中走受控 endpoint。

### Track C：桌面版 profile 對接

短期不直接讓 dev daemon 讀寫桌面版 `app.sqlite`。建議分兩階段：

1. **Profile Locator**：Web/daemon 可顯示並檢查桌面版資料根目錄存在性：
   `/Users/christianwu/Library/Application Support/Open Design/namespaces/release-stable-intel/data`
2. **Profile Attach Policy**：
   - 若桌面 daemon 正在跑：Web 應連到該 daemon API，而非另起 daemon 讀同一 DB。
   - 若桌面 app 已停止：允許開發者用 `OD_DATA_DIR=<desktop-data-root>` 啟動 daemon，並清楚顯示目前使用的是 desktop profile。

此階段的核心交付是降低誤用風險，而不是快速開雙 daemon 寫同一 SQLite。

### Track D：技能同步

新增 repo-to-desktop skill sync，來源與目標固定為：

- Source：`/Users/christianwu/open-design/skills`
- Target：`/Users/christianwu/Library/Application Support/Open Design/namespaces/release-stable-intel/data/skills`

同步策略：

```text
read source skill dirs with SKILL.md
read target sync manifest: .open-design-skill-sync.json
for each source skill:
  copy to target/<folder>
  skip dotfiles/runtime junk
  compute content hash
  update manifest entry
for deleted source skills:
  delete target folder only if manifest says this tool previously managed it
never delete target folders absent from manifest
write manifest atomically
return added/updated/unchanged/deleted/skipped
```

建議提供兩種入口：

- CLI：`pnpm tools-dev sync desktop-skills --namespace release-stable-intel`
- Daemon API：`POST /api/skills/sync-desktop`，僅允許 same-origin local request。

CLI 先落地，API/UI 可在後續接上 Settings 或 Skills Library。

### Track E：MCP 設定同步/匯入

在 Web 端 Settings 彈窗的「MCP」頁面右上角新增 `Sync Desktop`。

```text
SettingsDialog / MCP tab
  -> click Sync Desktop
  -> GET /api/desktop-profile/status
  -> POST /api/mcp/sync-desktop?dryRun=true
  -> show diff summary
  -> confirm
  -> POST /api/mcp/sync-desktop
  -> refresh current MCP config
```

同步策略建議：

- 預設方向為 **desktop profile → current web daemon profile**，避免 Web 誤覆蓋桌面端設定。
- 同步前先 dry-run，列出 added/updated/skipped/conflict，不顯示 secret 原文。
- MCP server identity 以 server id/name/command/url 綜合比對；secret/token 欄位只顯示存在與來源，不在 UI 明文呈現。
- 若同名 server 在兩端設定不同，預設標記 conflict，不自動覆蓋。

### Track F：Composio 連接器設定同步/匯入

在 Web 端 Settings 彈窗的「連接器」頁面右上角新增 `Sync Desktop`，聚焦 Composio provider/config store。

```text
SettingsDialog / Connectors tab
  -> click Sync Desktop
  -> POST /api/connectors/composio/sync-desktop?dryRun=true
  -> show services/accounts/config diff summary
  -> confirm
  -> POST /api/connectors/composio/sync-desktop
  -> refresh connector registry and credential status
```

同步策略建議：

- 預設只匯入 Composio 設定 metadata、enabled services、account linkage status 與必要 token references。
- 不在 UI 顯示 token 明文；若 token store 不可安全搬移，顯示「需重新授權」而不是假裝同步成功。
- 若桌面版與 Web 端同 connector service 都已設定，先進 conflict 狀態，由使用者選擇保留 Web 或匯入 Desktop。

### Track G：技能與設計系統重新掃描

將 repo 內建目錄作為 Web/daemon 預設掃描來源：

- Skills default source：`/Users/christianwu/open-design/skills`
- Design systems default source：`/Users/christianwu/open-design/design-systems`

UI 入口：

- 「技能與設計系統」→「技能」頁面新增「重新掃描」。
- 「技能與設計系統」→「設計系統」頁面在「+ 安裝」旁新增「重新掃描」。

行為要求：

- 重新掃描應觸發 daemon 重新讀取 repo source 與 runtime user source，並回傳 scan summary。
- Web 端 scan 後立即 refresh `/api/skills` 或 `/api/design-systems`。
- 若 repo default source 不存在或不可讀，UI 應顯示明確錯誤與實際路徑。
- Design system 整合應先把既有系統集中到 `/Users/christianwu/open-design/design-systems`，再透過 rescan 驗證可用。

## Tasks

### Phase 0：確認現況與測試基線

1. [x] 檢查桌面版 namespace data root 是否存在：`release-stable-intel/data`。
2. [x] 檢查 `data/skills` 目前內容，分類為「使用者已安裝」與「可由 repo 同步管理」。
3. [x] 檢查 `data/projects` 與 `app.sqlite` 是否有桌面 app 專案記錄，確認不可直接雙 daemon 寫入。
4. [x] 盤點 desktop profile 內 MCP 設定檔、Composio 設定檔與 credential/token store，標記可安全同步與需重新授權欄位。
5. [x] 檢查 repo `skills/` 與 `design-systems/` 內容，確認 Web/daemon 目前掃描來源與預設目錄是否一致。
6. [x] 建立測試用外部專案資料夾，例如 `/tmp/od-shared-project-fixture`，避免直接拿真實桌面資料做第一輪測試。
7. [x] 跑現有 folder import、skills、design-systems、MCP config、connectors 相關測試，記錄當前綠燈基線。

### Phase A：指定專案資料夾匯入

1. [x] 審核 `ImportFolderRequest` / `ImportFolderResponse` 是否足以承載 UI 需要的錯誤資訊與 `resolvedDir`。
2. [x] 在 Web 新專案面板補強 manual folder import 文案：清楚標示「直接編輯原資料夾」。
3. [ ] 在匯入成功後顯示 project source path / imported-from-folder 狀態，避免使用者誤以為是複製。
4. [x] 在匯入失敗時顯示 daemon structured error，而非 silent no-op。
5. [x] 補 daemon 測試：絕對路徑成功、相對路徑拒絕、不存在拒絕、匯入 daemon data dir 拒絕、symlink canonicalization。
6. [ ] 補 Web 測試：輸入路徑後呼叫 `importFolderProject`，成功後導向 `entryFile`。

### Phase B：Web 新增專案讀取路徑

1. [x] 在 `packages/contracts/src/api/projects.ts` 新增 path-backed create request/response type。
2. [x] 在 daemon 新增受控 endpoint，例如 `POST /api/projects/path-backed`。
3. [x] 將 `baseDir` 驗證抽成共用 helper，讓 folder import 與 path-backed create 共用同一套安全檢查。
4. [x] 支援 `use-existing`：資料夾存在且可讀寫，建立 project metadata 指向該路徑。
5. [x] 支援 `create-if-empty`：資料夾不存在時建立，或存在但必須為空；非空時回傳明確錯誤。
6. [x] 在 Web 新專案面板加入「進階：指定專案資料夾」欄位。
7. [ ] 建立 path-backed project 後，所有 file list/read/write/delete/search/archive 流程都必須透過 `resolveProjectDir(...)`。
8. [ ] 補測試：create path-backed、拒絕 client 自帶 `metadata.baseDir`、寫檔落在指定資料夾。

### Phase C：桌面版 profile 對接

1. [x] 新增 macOS packaged data root resolver，預設 namespace 為 `release-stable-intel`，但允許設定覆蓋。
2. [x] 新增 profile status API：回傳 desktop data root 是否存在、是否可讀、是否可寫、是否偵測到 app.sqlite。
3. [x] 新增 UI 狀態列或 Settings 區塊：顯示目前 Web daemon 使用的 `OD_DATA_DIR` 與是否為 desktop profile。
4. [ ] 若使用者要求接桌面 profile，提供明確流程：停止桌面 app → 以 `OD_DATA_DIR=<desktop-data-root>` 啟動 daemon → Web 透過 proxy 連入。
5. [ ] 禁止或警告「桌面 app running + dev daemon 同時寫同一 data root」。
6. [ ] 後續若要 live bridge，改走 sidecar/discovery 連到桌面 daemon URL，不直接重開資料庫。

### Phase D：技能同步 CLI

1. [x] 在 `tools/dev` 新增 skill sync 模組，輸入 source/target/namespace/dry-run。
2. [x] 掃描 source 下含 `SKILL.md` 的一層 skill folder。
3. [ ] 建立 copy allowlist：`SKILL.md`、`assets/`、`examples/`、`scripts/`、必要 metadata；排除 `.git`、`node_modules`、`.DS_Store`、大型 runtime output。
4. [x] 對每個 skill 計算 hash，比對 target 與 manifest，只有變更才寫入。
5. [x] 寫入 target 時採 temp dir + atomic rename，避免中途失敗留下半套 skill。
6. [x] 寫入 `.open-design-skill-sync.json`，記錄 source path、target folder、hash、updatedAt、managedBy。
7. [x] 刪除 source 不存在的 managed skill，但不得刪除 manifest 之外的 target folder。
8. [x] 增加 `--dry-run`，輸出 added/updated/deleted/skipped 而不寫檔。

### Phase E：技能同步 UI/API

1. [x] 在 contracts 新增 `SkillSyncRequest` / `SkillSyncResponse`。
2. [x] 在 daemon 新增 `POST /api/skills/sync-desktop`，僅允許 local same-origin。
3. [x] API 內部呼叫與 CLI 共用的 sync function，避免兩套同步邏輯漂移。
4. [x] 在「技能與設計系統」→「技能」頁面新增 `Sync Desktop` 或「同步到桌面版技能」入口。
5. [x] UI 顯示 dry-run summary，使用者確認後才執行寫入。
6. [x] 同步完成後重新 fetch `/api/skills`，確認桌面版 data skills 可被掃描。

### Phase F：MCP Desktop Sync UI/API

1. [x] 在 contracts 新增 `McpDesktopSyncRequest` / `McpDesktopSyncResponse`，支援 `dryRun`、`direction`、`conflictPolicy`。
2. [x] 在 daemon 新增 `POST /api/mcp/sync-desktop`，只允許 local same-origin request。
3. [x] 建立 MCP config diff helper，比對 current profile 與 desktop profile。
4. [x] 對 secret/token 欄位做遮罩與存在性標記，不回傳明文。
5. [x] 在 Settings 彈窗「MCP」頁面右上角新增 `Sync Desktop`。
6. [x] 第一次點擊先跑 dry-run 並顯示 added/updated/conflict/skipped summary。
7. [x] 使用者確認後才寫入 current web daemon profile，完成後重新讀取 MCP 設定。

### Phase G：Composio Connector Desktop Sync UI/API

1. [x] 在 contracts 新增 `ComposioDesktopSyncRequest` / `ComposioDesktopSyncResponse`。
2. [x] 在 daemon 新增 `POST /api/connectors/composio/sync-desktop`，只允許 local same-origin request。
3. [x] 建立 Composio config/credential diff helper，比對 desktop profile 與 current profile。
4. [x] 對不可安全搬移的 token 顯示 `requiresReauth`，不要回傳或複製明文 secret。
5. [x] 在 Settings 彈窗「連接器」頁面右上角新增 `Sync Desktop`。
6. [x] dry-run 顯示 service/account/config diff；confirm 後才匯入。
7. [x] 完成後重新 fetch connector registry、credential status 與 Composio provider 狀態。

### Phase H：技能與設計系統重新掃描

1. [x] 確認 daemon bundled skills source 預設為 `/Users/christianwu/open-design/skills`，且 `/api/skills` 會包含此來源。
2. [x] 新增 `POST /api/skills/rescan`，回傳 source path、count、errors、duration。
3. [x] 在「技能與設計系統」→「技能」頁面新增「重新掃描」按鈕。
4. [x] 點擊後呼叫 rescan API，成功後重新 fetch `/api/skills`。
5. [ ] 將目前 Open Design design system 整合到 `/Users/christianwu/open-design/design-systems`，保留每個系統的 `DESIGN.md` 與必要 assets。
6. [x] 確認 daemon bundled design-systems source 預設為 `/Users/christianwu/open-design/design-systems`。
7. [x] 新增 `POST /api/design-systems/rescan`，回傳 source path、count、errors、duration。
8. [x] 在「技能與設計系統」→「設計系統」頁面，於「+ 安裝」旁新增「重新掃描」按鈕。
9. [x] 點擊後呼叫 rescan API，成功後重新 fetch `/api/design-systems`。
10. [x] 若 source 缺失或有 invalid `DESIGN.md`，UI 顯示實際路徑與錯誤摘要。

### Phase J：c1 全局 AI 助理整合（最高優先級）

1. [ ] 在 `packages/contracts/src/api/` 新增 `c1.ts`：定義 `C1AssistantRequest`（messages、activeProjectId、activeFile、attachments、mode）、`C1AssistantResponse`（id、content、events、usage、finishReason）、SSE event union（`token` / `tool-call` / `tool-result` / `done` / `error`）。
2. [ ] 從 `packages/contracts/src/api/index.ts` re-export 新型別，沿用既有 API DTO 邊界規則。
3. [ ] 在 `apps/daemon/src/server.ts` 新增 `POST /api/c1/assistant`：only-local-same-origin、走 streaming（SSE 或 chunked）、把 web 收到的 messages + Active Context 餵給 Thesys/Claude provider。
4. [ ] daemon 端 token store：Thesys/Anthropic API key 從 `media-config.json` 讀取，**不得**透傳到 web；回應只回吐文字與工具事件。
5. [ ] 在 `apps/web/next.config`（或既有 proxy 設定）確認 `/api/c1/*` 會被 rewrite 到 daemon，與其他 `/api/*` 一致。
6. [ ] 在 `apps/web/src/providers/registry.ts` 新增 `c1AssistantProvider`：封裝 fetch + SSE 解析，回傳 async iterator 給 `AssistantProvider`。
7. [ ] 重構 `AssistantProvider.tsx` 改呼叫 daemon endpoint，移除任何 client-side API key 讀取；保留 legacy mode fallback。
8. [ ] `assistant-context.ts` 補上 Active Project / Active File / 選取技能 ID / 設計系統 ID，並在每次送出時序列化進 request。
9. [ ] `AssistantFab` 全頁面顯示；`AssistantSidebar` 支援由 `EntryView`、`SettingsDialog`、`LibrarySection` 觸發「帶 context 開啟」（`pushAssistantContext({ kind, payload })`）。
10. [ ] `feature-flags.ts` 預設 `ChatUIMode` 改為 `c1`；保留 legacy 切換但加註 deprecation 標記。
11. [ ] 補測試：`packages/contracts` 型別 round-trip；`apps/daemon/tests/c1-assistant-route.test.ts`（local-only guard、SSE 結束、錯誤封裝、token 不外洩）；`apps/web/tests/providers/c1.test.ts`（SSE 解析、context 注入）。
12. [ ] 收尾：`pnpm --filter @open-design/contracts typecheck` → `pnpm --filter @open-design/daemon test` → `pnpm --filter @open-design/web typecheck` → `pnpm guard` → `pnpm typecheck`。

### Phase I：文件與使用者流程

1. [ ] 在 `specs/current/250516` 補一份實作後狀態文件，列出可用指令與限制。
2. [ ] 在 README 或 relevant docs 補「Web 與 macOS Desktop 共用專案」章節。
3. [ ] 文件明確區分三種模式：外部資料夾匯入、Web 新建 path-backed project、desktop profile attach。
4. [ ] 文件明確標示技能同步是 repo skills → desktop user skills，不是 marketplace install。
5. [ ] 文件新增 MCP desktop sync、Composio connector desktop sync 的資料流、安全限制與重新授權情境。
6. [ ] 文件新增 skills/design-systems rescan 的預設目錄與故障排查。

## Verification

### 專案共享驗證

1. [ ] 建立 fixture：`/tmp/od-shared-project-fixture/index.html`。
2. [ ] 透過 Web 匯入該資料夾。
3. [ ] Web project file list 顯示 `index.html`。
4. [ ] 在 Web 編輯 `index.html` 並儲存。
5. [ ] 直接讀 `/tmp/od-shared-project-fixture/index.html`，確認檔案已被修改。
6. [ ] 重啟 daemon 後，project list 仍可開啟該 folder-backed project。
7. [ ] 嘗試匯入 daemon data dir，必須被拒絕。

### Web 新增指定路徑驗證

1. [ ] 指定一個不存在資料夾並使用 `create-if-empty`，daemon 建立資料夾與 project。
2. [ ] 指定一個非空資料夾並使用 `create-if-empty`，daemon 回傳可讀錯誤。
3. [ ] 指定一個既有專案資料夾並使用 `use-existing`，Web 可讀寫原檔。
4. [ ] `POST /api/projects` 若帶 `metadata.baseDir` 仍必須 400。

### 技能同步驗證

1. [ ] 執行 dry-run，確認 summary 不寫入 target。
2. [ ] 執行同步，target 產生對應 skill folders 與 manifest。
3. [ ] 修改 source 某個 `SKILL.md`，再次同步只更新該 skill。
4. [ ] 在 target 手動新增一個非 managed skill，同步後不得刪除。
5. [ ] 從 source 刪除一個 previously managed test skill，同步後只刪除該 managed target folder。
6. [ ] 啟動桌面版或指向 desktop data root 的 daemon，`GET /api/skills` 可看到同步後技能。

### MCP Desktop Sync 驗證

1. [ ] 在 desktop profile 建立測試 MCP server 設定。
2. [ ] Web Settings → MCP → `Sync Desktop` 第一次執行 dry-run，只顯示 diff，不寫入 current profile。
3. [ ] 確認後匯入，current profile 可讀到該 MCP server。
4. [ ] secret/token 欄位 UI 只顯示 masked 或 exists，不顯示明文。
5. [ ] 同名不同內容的 MCP server 進入 conflict，不自動覆蓋。

### Composio Connector Sync 驗證

1. [ ] 在 desktop profile 建立測試 Composio connector 設定。
2. [ ] Web Settings → 連接器 → `Sync Desktop` 第一次執行 dry-run，只顯示 services/accounts/config diff。
3. [ ] 確認後匯入 current profile，connector registry/status 更新。
4. [ ] 無法安全搬移的 token 顯示 `requiresReauth`。
5. [ ] 同 service 兩端都有設定時進入 conflict，不自動覆蓋。

### 技能與設計系統重新掃描驗證

1. [ ] 新增或修改 `/Users/christianwu/open-design/skills/<skill>/SKILL.md`。
2. [ ] Web「技能」頁點擊「重新掃描」，列表反映新增或修改。
3. [ ] Rescan response 顯示 source path 為 `/Users/christianwu/open-design/skills`。
4. [ ] 將 design system 放入 `/Users/christianwu/open-design/design-systems/<id>/DESIGN.md`。
5. [ ] Web「設計系統」頁點擊「重新掃描」，列表反映新增或修改。
6. [ ] Rescan response 顯示 source path 為 `/Users/christianwu/open-design/design-systems`。

### Repo 驗證指令

依變更範圍由小到大執行：

```bash
pnpm --filter @open-design/contracts typecheck
pnpm --filter @open-design/daemon test
pnpm --filter @open-design/web typecheck
pnpm --filter @open-design/tools-dev build
pnpm guard
pnpm typecheck
```

若改動 packaged/desktop sidecar 或 namespace path：

```bash
pnpm --filter @open-design/desktop build
pnpm --filter @open-design/tools-pack build
pnpm tools-dev run web --daemon-port 17456 --web-port 17573
pnpm tools-dev status --json
```

## Risks

- **SQLite 同時寫入風險**：桌面 app 與 dev daemon 不應同時寫同一 `app.sqlite`。解法是同 daemon bridge 或啟動前檢查/提示。
- **技能同步誤刪風險**：需用 manifest 控制 managed entries，禁止清空整個 target。
- **MCP/Composio secret 外洩風險**：sync API 不得回傳明文 token；dry-run 與 UI 只能顯示 masked/status。
- **路徑權限風險**：所有 `baseDir` 必須 canonicalize，且不得指向 daemon data root。
- **UI 誤解風險**：folder-backed project 是 in-place edit，不是 copy/import snapshot，文案必須清楚。
- **桌面 namespace 漂移**：`release-stable-intel` 是目前目標；後續應支援 namespace selector 或自動偵測。
- **Rescan 來源漂移風險**：skills/design-systems 的 repo source 與 runtime user source 需在 UI 顯示清楚，避免使用者誤以為安裝到錯誤位置。

## Recommended Execution Order

1. **Phase J（最高優先）**：c1 全局 AI 助理整合 — 先落地 contracts → daemon endpoint → web rewrite → providers → typecheck/guard，作為跨 phase 共用基礎。
2. 完成 Phase A/B 收尾：folder import 與 path-backed project 的剩餘測試與 file API 流程接齊。
3. 完成 Phase G-4：補 `requiresReauth` 真實判斷與錯誤語義（僅 daemon/contracts/providers）。
4. 完成 Phase H-10：source 缺失/invalid `DESIGN.md` 的 UI 錯誤摘要（Settings/Library 區塊）。
5. 執行 Phase I：文件與操作流程補全（含 c1 助理使用指引）。
6. （已完成）Phase D/E 技能同步 CLI 與 API/UI；Phase F/G MCP 與 Composio sync；Phase H 重新掃描。

## Approval Gate

此文件是開發計劃，不包含 production code。建議確認以下決策後再進入實作：

1. 技能同步是否採「manifest-managed mirror」策略，而不是全量覆蓋 target。
2. Web 新增指定路徑是否接受新增獨立 endpoint `POST /api/projects/path-backed`。
3. 桌面版 project sharing 第一階段是否以「外部資料夾 in-place edit」為準，不直接雙 daemon 寫 desktop SQLite。
4. MCP 與 Composio sync 是否採「desktop → current web profile」單向匯入為第一階段，雙向同步延後。
5. Skills/design-systems rescan 是否只重新掃描 repo source + runtime source，不做自動安裝或刪除。
