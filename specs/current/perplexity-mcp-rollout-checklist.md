# Perplexity MCP Rollout Checklist（P0）

## 1. 啟動前檢查

1. Node 版本符合專案要求（建議 Node 24）。
2. `pnpm --filter @open-design/daemon typecheck` 通過。
3. 以專案根目錄啟動 MCP：
   - `pnpm --filter @open-design/daemon build`
   - `node /Users/christianwu/open-design/apps/daemon/dist/cli.js mcp perplexity --project-root /Users/christianwu/open-design`

## 2. Perplexity Local Connector 設定

1. 在 Perplexity Mac App 新增 local MCP connector。
2. command 指向 `node`。
3. args 指向 `.../apps/daemon/dist/cli.js mcp perplexity --project-root ...`。
4. 儲存後確認 connector 狀態為可用。

## 3. 功能驗收（依序）

1. `od_health`：回傳 `ok: true`。
2. `od_agents_list`：可見 priority order：
   - `codex`
   - `claude-code`
   - `api-fallback`
3. `od_skills_list`：可列出 skills 清單。
4. `od_route_task`：可回傳 lane 與推薦技能。
5. `od_generate_design_brief`：可在 `specs/current` 產生檔案。
6. `od_write_requirement_doc` + `od_read_project_doc`：可寫入/讀回同一檔案。
7. `od_execution_validate_adapter`：
   - 三優先 adapter 回傳 `allowed: true`
   - 非優先 adapter 應被拒絕

## 4. 錯誤診斷文案（標準）

### 問題：Perplexity 連不到 MCP

- 診斷：
  - connector command/args 是否正確
  - MCP process 是否仍在前景執行
  - 專案路徑是否存在
- 建議文案：
  - `MCP bridge did not start. Verify command, args, and project-root path.`

### 問題：`tools/list` 成功但 `tools/call` 失敗

- 診斷：
  - input schema 不符合（缺必填欄位）
  - outputPath/inputPath 越界
- 建議文案：
  - `Tool input is invalid or path is outside project root.`

### 問題：adapter 不可用

- 診斷：
  - 目標 CLI 未安裝
  - `claude-code` 對應 runtime id 為 `claude`，需要映射
- 建議文案：
  - `Adapter unavailable in runtime. Install or authenticate the target CLI first.`

### 問題：`od_run_agent` 回傳 `not_implemented`

- 說明：
  - P0 故意只完成 skeleton + gating，不啟用通用 execution。
- 建議文案：
  - `Execution transport is deferred in P0. Continue with planning/document tools and enable execution in P1.`

## 5. Go/No-Go 標準

Go（可進下一步）條件：

1. Local connector 可穩定呼叫 `od_health` 與 `od_agents_list`。
2. 文件工具可穩定寫入與讀回。
3. adapter gating 對非優先 adapter 拒絕行為正確。

No-Go（暫停擴展）條件：

1. local connector 經常斷線或 process 不穩。
2. 路徑越界保護失效。
3. 三優先 adapter 狀態辨識不可靠。

