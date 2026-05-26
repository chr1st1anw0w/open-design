# Open Design Runtime Modes (Quick Guide)

本文件說明 `open-design` 在開發時 `daemon / web / desktop` 三種模式的差異，以及在**專案根目錄**可直接使用的啟動指令。

## 1) 三種模式差異

### daemon
- 角色：本機後端服務（API、資料儲存、agent 執行、artifact 管理）。
- 主要用途：提供 `/api/*`、專案資料與代理執行能力。
- 預設不提供前端畫面。

### web
- 角色：Next.js 前端介面。
- 主要用途：提供瀏覽器可操作的 UI。
- 會依賴 daemon API；僅啟 `web` 時通常仍需要 daemon 可用。

### desktop
- 角色：Electron 桌面殼層。
- 主要用途：桌面版 Open Design 視窗與本機整合能力。
- 透過 sidecar/IPC 讀取 web 執行狀態，不直接猜測 web port。

## 2) 根目錄啟動指令

先切到專案根目錄：

```bash
cd /Users/christianwu/open-design
```

### 啟動全部（建議日常開發）

```bash
pnpm tools-dev
```

或指定 port：

```bash
pnpm tools-dev restart --daemon-port 7457 --web-port 5175
```

### 僅啟單一模式

```bash
pnpm tools-dev start daemon
pnpm tools-dev start web
pnpm tools-dev start desktop
```

### 前景執行（保留在同一終端）

```bash
pnpm tools-dev run daemon
pnpm tools-dev run web --daemon-port 7457 --web-port 5175
pnpm tools-dev run desktop
```

## 3) 狀態與停止

```bash
pnpm tools-dev status --json
pnpm tools-dev logs --json
pnpm tools-dev stop
```

僅操作單一模式：

```bash
pnpm tools-dev status daemon
pnpm tools-dev stop web
pnpm tools-dev restart desktop
```

## 4) 注意事項

- 專案規範 Node 版本為 `~24`（可由 `.node-version` 看到 `24`）。
- 開發流程統一走 `pnpm tools-dev`，不要用 root `pnpm dev` / `pnpm start`。
