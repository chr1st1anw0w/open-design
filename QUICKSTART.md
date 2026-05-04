- 以下為完整繁體中文翻譯：

  ------

  # 快速入門

  <p align="center"><b>中文</b> · <a href="QUICKSTART.EN.md">English</a>

  在本地端完整執行此產品。

  ## 環境需求

  * **Node.js：** `~24`（Node 24.x）。專案透過 `package.json#engines` 強制指定此版本。
  * **pnpm：** `10.33.x`。專案透過 `packageManager` 鎖定 `pnpm@10.33.2`；使用 Corepack 可自動選用指定版本。
  * **作業系統：** macOS、Linux 與 WSL2 為主要支援路徑。Windows 原生環境在大多數流程中應可運作，但 WSL2 是更穩定的基準環境。
  * **選用本地 Agent CLI：** Claude Code、Codex、Devin for Terminal、Gemini CLI、OpenCode、Cursor Agent、Qwen、GitHub Copilot CLI 等。若皆未安裝，可於設定中使用 BYOK API 模式。

  `nvm` / `fnm` 為選用的便利工具，非必要的專案設定。若有使用，請在執行 pnpm 前先安裝並切換至 Node 24：

  ```
  bash
  # nvm
  nvm install 24
  nvm use 24
  
  # fnm
  fnm install 24
  fnm use 24
  ```

  接著啟用 Corepack，讓專案自動選用正確的 pnpm 版本：

  ```
  bash
  corepack enable
  corepack pnpm --version   # 應輸出 10.33.2
  ```

  ## 一鍵啟動（開發模式）

  ```
  bash
  corepack enable
  pnpm install
  pnpm tools-dev run web # 在前景啟動 daemon + web
  # 開啟 tools-dev 所輸出的網頁網址
  ```

  若需同時在背景啟動桌面殼層及所有受管 sidecar：

  ```
  bash
  pnpm tools-dev # 在背景啟動 daemon + web + desktop
  ```

  首次載入時，應用程式會自動偵測已安裝的 code-agent CLI（Claude Code / Codex / Devin for Terminal / Gemini / OpenCode / Cursor Agent / Qwen），自動選用，並預設使用 `web-prototype` 技能與 `Neutral Modern` 設計系統。輸入提示詞並點擊 **Send**。Agent 會串流輸出至左側面板；`<artifact>` 標籤會被解析後，HTML 即時渲染於右側。完成後，點擊 **Save to disk** 將成品儲存至 `./.od/artifacts/<timestamp>-<slug>/index.html`。

  **Design system（設計系統）** 下拉選單內建 **129 個設計系統**，包含 2 個手工撰寫的入門系統（Neutral Modern、Warm Editorial）、70 個打包的產品設計系統，以及 57 個來自 [`awesome-design-skills`](https://github.com/bergside/awesome-design-skills) 的設計技能。選擇其一，即可將每個原型套用該品牌的視覺風格。

  **Skill（技能）** 下拉選單依模式分組（Prototype / Deck / Template / Design system），並以 `· default` 後綴標示各模式的預設技能。內建技能如下：

  * **Prototype（原型）** — `web-prototype`（通用）、`saas-landing`、`dashboard`、`pricing-page`、`docs-page`、`blog-post`、`mobile-app`。
  * **Deck / PPT** — `simple-deck`（單一檔案水平滑動）與 `magazine-web-ppt`（來自 [`op7418/guizang-ppt-skill`](https://github.com/op7418/guizang-ppt-skill) 的 `guizang-ppt` 套件 — deck 模式的預設技能，附帶自有 assets/template 及 4 個參考檔案）。包含附屬檔案的技能會自動在前方加入「Skill root（技能根目錄，絕對路徑）」引言，讓 Agent 能以磁碟上的實際路徑解析 `assets/template.html` 與 `references/*.md`，而非使用其工作目錄。

  搭配一個技能與一個設計系統，只需一條提示詞，即可生成符合版面需求的原型或簡報，並呈現所選的視覺語言。

  ## 其他指令

  ```
  bash
  pnpm tools-dev                 # 在背景啟動 daemon + web + desktop
  pnpm tools-dev start web       # 在背景啟動 daemon + web
  pnpm tools-dev run web         # 在前景啟動 daemon + web（e2e / dev server）
  pnpm tools-dev restart         # 重啟 daemon + web + desktop
  pnpm tools-dev restart --daemon-port 7457 --web-port 5175
  pnpm tools-dev status          # 檢視受管執行環境狀態
  pnpm tools-dev logs            # 顯示 daemon / web / desktop 日誌
  pnpm tools-dev check           # status + 最近日誌 + 常見診斷資訊
  pnpm tools-dev stop            # 停止受管執行環境
  pnpm --filter @open-design/daemon build  # 編譯 apps/daemon/dist/cli.js 以產生 `od` 指令
  pnpm build                     # 正式環境建置 + 靜態匯出至 apps/web/out/
  pnpm typecheck                 # 工作區型別檢查
  ```

  `pnpm tools-dev` 是唯一的本地端生命週期入口點。請勿使用已移除的舊版根目錄別名（`pnpm dev`、`pnpm dev:all`、`pnpm daemon`、`pnpm preview`、`pnpm start`）。

  在本地開發期間，`tools-dev` 會先啟動 daemon，再將其 port 傳入 `apps/web`，而 `apps/web/next.config.ts` 會將 `/api/*`、`/artifacts/*` 與 `/frames/*` 反向代理至該 daemon port，使 App Router 應用程式無需額外的 CORS 設定即可與同層的 Express 程序通訊。

  ## 媒體生成 / Agent 調度器檢查

  Image、Video、Audio 與 HyperFrames 技能會透過 daemon 在啟動 Agent 時注入的環境變數呼叫本地端 `od` CLI：

  * `OD_BIN` — `apps/daemon/dist/cli.js` 的絕對路徑。
  * `OD_DAEMON_URL` — 正在執行的 daemon 網址。
  * `OD_PROJECT_ID` — 當前專案 ID。
  * `OD_PROJECT_DIR` — 當前專案的檔案目錄。

  若媒體生成失敗並出現 `OD_BIN: parameter not set`、`apps/daemon/dist/cli.js missing` 或 `failed to reach daemon at http://127.0.0.1:0` 等錯誤，請重新建置 daemon CLI 並重啟受管執行環境：

  ```
  bash
  pnpm --filter @open-design/daemon build
  pnpm tools-dev restart --daemon-port 7457 --web-port 5175
  ls -la apps/daemon/dist/cli.js
  curl -s http://127.0.0.1:7457/api/health
  ```

  接著從 Open Design 應用程式重新開啟專案，而非繼續舊有的終端機 Agent 工作階段。由 daemon 啟動的 Agent 應能看到如下的變數值：

  ```
  bash
  echo "OD_BIN=$OD_BIN"
  echo "OD_PROJECT_ID=$OD_PROJECT_ID"
  echo "OD_PROJECT_DIR=$OD_PROJECT_DIR"
  echo "OD_DAEMON_URL=$OD_DAEMON_URL"
  ls -la "$OD_BIN"
  ```

  `OD_DAEMON_URL` 必須為真實的 daemon port，例如 `http://127.0.0.1:7457`，而非 `http://127.0.0.1:0`。`:0` 僅為「選取空閒 port」的內部啟動提示，不應洩漏至 Agent 工作階段中。

  在僅執行 daemon 的正式生產模式下，daemon 會自行在 `http://localhost:7456` 提供靜態的 Next.js 匯出內容，無需反向代理。

  若在 daemon 前方部署了 nginx，請確保 SSE 路由不使用緩衝與壓縮。常見的失敗情境為：瀏覽器主控台在約 80–90 秒後出現 `net::ERR_INCOMPLETE_CHUNKED_ENCODING 200 (OK)`，原因是 nginx 的 `gzip on` 設定即便在 daemon 已傳送 `X-Accel-Buffering: no` 的情況下，仍會對分塊的 SSE 回應進行緩衝。

  ```
  text
  location /api/ {
      proxy_pass http://127.0.0.1:7456;
  
      proxy_buffering off;
      gzip off;
  
      proxy_read_timeout 86400s;
      proxy_send_timeout 86400s;
      proxy_http_version 1.1;
      proxy_set_header Connection "";
  
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
  }
  ```

  ## 兩種執行模式

  | 模式                                           | 選擇器顯示值                                                 | 請求流程                                                     |
  | ---------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
  | **本地 CLI**（daemon 偵測到 Agent 時的預設值） | "Local CLI"                                                  | 前端 → daemon `/api/chat` → `spawn(<agent>, ...)` → stdout → SSE → artifact 解析器 → 預覽 |
  | **API 模式**（備援 / 無 CLI 時）               | "Anthropic API" / "OpenAI API" / "Azure OpenAI" / "Google Gemini" | 前端 → daemon `/api/proxy/{provider}/stream` → provider SSE 正規化為 `delta/end/error` → artifact 解析器 → 預覽 |

  兩種模式皆使用**相同的** `<artifact>` 解析器與**相同的**沙盒化 iframe。唯一的差異在於傳輸方式及 system prompt 的傳遞方式（本地 CLI 沒有獨立的 system 頻道，因此組合後的 prompt 會折入 user message 中）。

  ## Prompt 組合

  每次傳送時，應用程式會從三個層次建構 system prompt，再傳送給 provider：

  ```
  text
  BASE_SYSTEM_PROMPT   （輸出規範：以 <artifact> 包覆，不使用程式碼圍欄）
     + 當前設計系統內容  （DESIGN.md — 色盤 / 字型 / 版面）
     + 當前技能內容      （SKILL.md — 工作流程與輸出規則）
  ```

  在頂部工具列切換技能或設計系統後，下一次傳送即使用新的組合。內容在每個工作階段中會按選項快取於記憶體，因此每次選取僅需向 daemon 發出一次請求。

  ## 檔案結構

  ```tex
  open-design/
  ├── apps/
  │   ├── daemon/                # Node/Express — 啟動本地 Agent 並提供 API
  │   │   └── src/
  │   │       ├── cli.ts             # `od` 指令入口
  │   │       ├── server.ts          # /api/* + 靜態檔案服務
  │   │       ├── agents.ts          # PATH 掃描器（claude/codex/devin/gemini/opencode/cursor-agent/qwen/copilot）
  │   │       ├── skills.ts          # SKILL.md 載入器（frontmatter 解析器）
  │   │       └── design-systems.ts  # DESIGN.md 載入器
  │   │   ├── sidecar/           # tools-dev daemon sidecar 包裝器
  │   │   └── tests/             # daemon 套件測試
  │   ├── web/                   # Next.js 16 App Router + React 客戶端
  │       ├── app/               # App Router 入口
  │       ├── src/               # React + TypeScript 客戶端 / 執行時模組
  │       │   ├── App.tsx        # 協調模式 / 技能 / 設計系統選擇器與傳送功能
  │       │   ├── providers/     # daemon + BYOK API 傳輸層
  │       │   ├── prompts/       # system、discovery、directions、deck framework
  │       │   ├── artifacts/     # 串流 <artifact> 解析器 + manifests
  │       │   ├── runtime/       # iframe srcdoc、markdown、匯出輔助工具
  │       │   └── state/         # localStorage + daemon 支援的專案狀態
  │       ├── sidecar/           # tools-dev web sidecar 包裝器
  │       └── next.config.ts     # tools-dev 反向代理 + 正式環境 apps/web/out 匯出設定
  │   └── desktop/               # Electron 執行環境，由 tools-dev 啟動與檢視
  ├── packages/
  │   ├── contracts/             # web/daemon 應用程式共用合約
  │   ├── sidecar-proto/         # Open Design sidecar 協定合約
  │   ├── sidecar/               # 通用 sidecar 執行時原語
  │   └── platform/              # 通用程序 / 平台原語
  ├── tools/dev/                 # `pnpm tools-dev` 生命週期與檢視 CLI
  ├── e2e/                       # Playwright UI + 外部整合 / Vitest 測試工具
  ├── skills/                    # SKILL.md — 可從任何 Claude Code skill repo 放入
  │   ├── web-prototype/         # 通用單一畫面原型（prototype 模式預設）
  │   ├── saas-landing/          # 行銷頁面（hero / features / pricing / CTA）
  │   ├── dashboard/             # 管理後台 / 數據分析儀表板
  │   ├── pricing-page/          # 獨立定價頁面 + 比較表
  │   ├── docs-page/             # 三欄式文件版面
  │   ├── blog-post/             # 長篇編輯式文章
  │   ├── mobile-app/            # 手機框架單一畫面
  │   ├── simple-deck/           # 簡約水平滑動簡報
  │   ├── guizang-ppt/           # magazine-web-ppt — 打包的 deck/PPT 預設
  │   │   ├── SKILL.md
  │   │   ├── assets/template.html
  │   │   └── references/{themes,layouts,components,checklist}.md
  │   └── 2 -> /Users/christianwu/open-design/skills/2/  # symlink — 擴充技能套件
  │       ├── diagram-design/    # Excalidraw 視覺化圖表生成技能 — 透過 Playwright 視覺驗證迭代，產出具備正確間距、視覺層次與元素對齊的精緻流程圖與架構圖
  │       ├── impeccable/        # 高品質 UI 設計語言套件（pbakaus/impeccable）— 提供 23 個設計指令（/audit、/polish、/critique、/animate 等），內建 7 個領域參考文件（typography、color、spatial、motion、interaction、responsive、ux-writing）及反模式偵測，對抗 AI 生成介面的視覺同質化
  │       ├── guizang-ppt/       # magazine-web-ppt — 打包的 deck/PPT 預設（op7418/guizang-ppt-skill）
  │       │   ├── SKILL.md
  │       │   ├── assets/template.html
  │       │   └── references/{themes,layouts,components,checklist}.md
  │       └── huashu-design/     # 花叔Design（alchaincyf/huashu-design）— 以 HTML 為原生格式生成高保真原型、互動 Demo、簡報、動畫與設計變體，內建 20 種設計哲學詞彙、5 維度專家評審機制，支援品牌資產分析及 MP4/GIF/PPTX 匯出
  ├── design-systems/            # DESIGN.md — 9 節結構（awesome-claude-design）
  │   ├── default/               # Neutral Modern（入門）
  │   ├── warm-editorial/        # Warm Editorial（入門）
  │   ├── README.md              # 目錄總覽
  │   └── …129 個系統            # 2 個入門 · 70 個產品系統 · 57 個設計技能
  ├── scripts/sync-design-systems.ts    # 從上游 getdesign tarball 重新匯入
  ├── docs/                      # 產品願景 + 規格文件
  ├── .od/                       # 執行時資料（gitignored，自動建立）
  │   ├── app.sqlite              #   專案 / 對話 / 訊息 / 分頁
  │   ├── artifacts/              #   一次性「Save to disk」輸出
  │   └── projects/<id>/          #   每個專案的工作目錄 + agent cwd
  ├── pnpm-workspace.yaml        # apps/* + packages/* + tools/* + e2e
  └── package.json               # 根目錄品質檢查指令 + `od` bin
  ```

  ## 疑難排解

  * **「no agents found on PATH」** — 請安裝以下其中之一：`claude`、`codex`、`devin`、`gemini`、`opencode`、`cursor-agent`、`qwen`、`copilot`。或於設定中切換至 API 模式並貼上 provider 金鑰。
  * **daemon 在 /api/chat 回傳 500** — 請查看 daemon 終端機的 stderr 輸出；通常是 CLI 拒絕了傳入的參數。不同 CLI 的 argv 格式各異；若需調整，請參閱 `apps/daemon/src/agents.ts` 中的 `buildArgs`。
  * **媒體生成顯示 `OD_BIN` 缺失或 daemon URL 為 `:0`** — 執行上方的媒體調度器檢查步驟。請勿繼續使用舊有的 CLI 工作階段；請從 Open Design 應用程式重新開啟專案，讓 daemon 注入新的 `OD_*` 變數。
  * **Codex 載入了過多的外掛上下文** — 以 `OD_CODEX_DISABLE_PLUGINS=1 pnpm tools-dev` 啟動 Open Design，使 daemon 啟動的 Codex 程序以 `--disable plugins` 執行。
  * **artifact 始終未能渲染** — 模型輸出了未以 `<artifact>` 包覆的文字。請確認 system prompt 是否有正確傳遞（查看 daemon 日誌），並考慮切換至更強大的模型或規範更嚴格的技能。

  ## 對應至產品願景

  此快速入門是 [`docs/`](https://www.perplexity.ai/search/docs/) 規格文件的可執行種子。規格文件描述了此專案的成長方向（詳見 [`docs/roadmap.md`](https://www.perplexity.ai/search/docs/roadmap.md)）。重點摘要如下：

  * `docs/architecture.md` 描述已上線的技術堆疊：前端為 Next.js 16 App Router，後方搭配本地 daemon，開發環境下 `apps/web/next.config.ts` 的反向代理設定確保瀏覽器始終與同一個 `/api` 介面通訊。
  * `docs/skills-protocol.md` 描述完整的 `od:` frontmatter 規範（型別化輸入、滑桿、能力閘控）。此 MVP 僅讀取 `name` / `description` / `triggers` / `od.mode` / `od.design_system.requires` — 如需擴充，請修改 `apps/daemon/src/skills.ts`。
  * `docs/agent-adapters.md` 預見了更豐富的調度機制（能力偵測、串流工具呼叫）。目前 `apps/daemon/src/agents.ts` 是一個最精簡的調度器 — 足以驗證配線邏輯。
  * `docs/modes.md` 列出四種模式：prototype / deck / template / design-system。目前已提供前兩種模式的技能；選擇器已依 `mode` 進行過濾。
