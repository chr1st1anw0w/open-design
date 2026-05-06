# 目錄導覽指南

此檔案是所有 AI agent 進入本 repository 的唯一知識來源。
進入 `apps/`、`packages/` 或 `tools/` 子目錄前，請先讀完此檔案，再讀該層的 `AGENTS.md` 取得模組細節。
請勿將子模組細節複製回根目錄檔案；根目錄只關注跨 repository 的邊界、工作流程與指令。

## 核心文件索引

- 產品說明與上手指南：`README.md`、`README.zh-CN.md`、`QUICKSTART.md`
- 貢獻與環境設定：`CONTRIBUTING.md`、`CONTRIBUTING.zh-CN.md`
- 架構與協定：`docs/spec.md`、`docs/architecture.md`、`docs/skills-protocol.md`、`docs/agent-adapters.md`、`docs/modes.md`
- 路線圖與參考資料：`docs/roadmap.md`、`docs/references.md`、`specs/current/maintainability-roadmap.md`
- 子目錄 agent 指引：`apps/AGENTS.md`、`packages/AGENTS.md`、`tools/AGENTS.md`

## Workspace 目錄結構

- Workspace 套件來自 `pnpm-workspace.yaml`：`apps/*`、`packages/*`、`tools/*`、`e2e`
- 頂層內容目錄：
  - `skills/`：產出物技能（artifact-shape skills）
  - `design-systems/`：品牌 `DESIGN.md` 檔案
  - `craft/`：通用品牌無關的工藝規則，技能可透過 `od.craft.requires` 選用
- `apps/web`：Next.js 16 App Router + React 18 網頁執行環境；**禁止還原 `apps/nextjs`**
- `apps/daemon`：本地特權 daemon 與 `od` 執行檔，負責 `/api/*`、agent 生成、技能、設計系統、產出物與靜態服務
- `apps/desktop`：Electron 殼層，透過 sidecar IPC 找到網頁 URL
- `apps/packaged`：輕量打包 Electron 執行入口，啟動打包 sidecar 並只負責 `od://` 進入點黏合
- `packages/contracts`：純 TypeScript 的 web/daemon 應用程式合約層
- `packages/sidecar-proto`：Open Design sidecar 業務協定
- `packages/sidecar`：通用 sidecar 執行環境
- `packages/platform`：通用 OS 程序原語
- `tools/dev`：本地開發生命週期控制平面
- `tools/pack`：本地打包建置/啟動/停止/日誌控制平面及 Mac beta 發布產出物準備介面
- `e2e`：Playwright UI 規格與 Vitest/jsdom 整合測試

## 非活躍或佔位目錄

- `apps/nextjs` 與 `packages/shared` 已移除；**禁止重建或引用**
- `.od/`、`.tmp/`、`e2e/.od-data`、Playwright 報告及 agent 草稿目錄屬本地執行期資料，**必須排除在 git 之外**

---

# 開發工作流程

## 環境基線

- 執行環境：Node `~24`、`pnpm@10.33.2`；使用 Corepack 確保選用 `package.json` 中固定的 pnpm 版本
- 新建的入口點、模組、腳本、測試、reporter 與設定檔預設使用 TypeScript
- 殘留 JavaScript 僅限：產生的輸出、vendored 依賴、有明確文件的相容性建置產出物，及 `scripts/check-residual-js.ts` 中的白名單

## 本地生命週期

- 唯一的本地開發生命週期入口：`pnpm tools-dev`
- **禁止新增或還原**根目錄生命週期別名：`pnpm dev`、`pnpm dev:all`、`pnpm daemon`、`pnpm preview`、`pnpm start`
- Port 由 `tools-dev` 旗標控管：`--daemon-port` 與 `--web-port`
- `tools-dev` 匯出 `OD_PORT`（網頁代理目標）與 `OD_WEB_PORT`（網頁監聽器）；**禁止使用 `NEXT_PORT`**

## 邊界約束

- 共用 API DTO、SSE 事件聯合型別、錯誤形態、任務形態、範例 payload 放在 `packages/contracts`
- `packages/contracts` 必須為純 TypeScript，不得依賴 Next.js、Express、Node 檔案系統/程序 API、瀏覽器 API、SQLite、daemon 內部或 sidecar 控制平面依賴
- Sidecar 程序 stamp 必須恰好包含五個欄位：`app`、`mode`、`namespace`、`ipc`、`source`
- 預設執行期檔案放在 `<project-root>/.tmp/<source>/<namespace>/...`；POSIX IPC socket 固定在 `/tmp/open-design/ipc/<namespace>/<app>.sock`

## Git Commit 規範

- Git commit **不得**包含 `Co-authored-by` trailer 或任何共同作者 metadata

## 驗證策略

- 套件、workspace 或指令入口變更後，執行 `pnpm install` 保持 workspace 連結與產生的 dist 入口為最新狀態
- 一般工作標記完成前，至少執行 `pnpm typecheck` 與 `pnpm test`；涉及建置邊界時一併執行 `pnpm build`
- Web/e2e 循環優先使用：`pnpm tools-dev run web --daemon-port <port> --web-port <port>`

---

# 常用指令

```bash
# 安裝與啟動
pnpm install
pnpm tools-dev
pnpm tools-dev start web
pnpm tools-dev run web --daemon-port 17456 --web-port 17573

# 狀態與日誌
pnpm tools-dev status --json
pnpm tools-dev logs --json
pnpm tools-dev stop

# 品質檢查
pnpm typecheck
pnpm test
pnpm build
pnpm check:residual-js

# 子套件單獨執行
pnpm --filter @open-design/web typecheck
pnpm --filter @open-design/daemon test
pnpm --filter @open-design/desktop build
````

---

## 建議納入的個人補充內容

根據本次對話的所有討論，以下內容**建議加到 `AGENTS.md` 尾端**，作為你個人 fork 的補充區塊：

```markdown
***

# Fork 維護者補充（chr1st1anw0w）

## Remote 結構
- `fork`：https://github.com/chr1st1anw0w/open-design.git（有寫入權限，推送目標）
- `origin`：https://github.com/nexu-io/open-design（上游組織 repo，無寫入權限）
- `upstream`：https://github.com/nexu-io/open-design.git（同步來源）

## Git 工作原則
- 永遠不要直接推送到 `origin` 或 `upstream`
- 推送指令固定為：`git push fork <branch> --force-with-lease`
- 每次開發前先同步上游：`git fetch upstream && git rebase upstream/main`
- 主要開發分支：`i18n/zh-tw-ui-dict`

## Skills 目錄
- 所有自訂技能位於 `/skills/`，進行設計相關任務前請載入此目錄的所有 `.md` 檔案
- UI 文字命名規則遵循繁體中文（zh-TW）
- 新增技能請放在 `skills/<skill-name>/index.md`

## 語言規範
- UI 元件名稱與 design token：使用繁體中文（zh-TW）
- 程式碼、型別、變數名稱：英文
- Commit message：英文，格式 `feat/fix/docs/chore(scope): description`

## 不可修改的檔案
- `README.de.md`、`README.fr.md`、`README.ja-JP.md`、`README.ko.md`、`README.ru.md`、`README.uk.md`、`README.zh-CN.md`
- `CONTRIBUTING.de.md`、`CONTRIBUTING.ja-JP.md`、`QUICKSTART.fr.md`
- upstream remote 設定
```

---

## Fork Sync Policy (Required)

- `nexu-io/open-design` is upstream source only. Never push to it.
- Allowed push target is maintainer fork only (e.g. `fork` remote).
- Local git must keep a push guard against `nexu-io/open-design`.
- Upstream sync direction is one-way: `upstream/main` -> local `main` (or sync PR branch).
- When upstream sync has merge conflicts, stop auto-merge and request maintainer review.
