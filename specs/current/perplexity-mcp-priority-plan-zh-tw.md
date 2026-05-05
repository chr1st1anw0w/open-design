# Perplexity 優先 MCP 開發策略（Phase P0）

## 1. 目標

本階段以 **Perplexity（Mac App / Remote Connector）可直接使用 open-design MCP** 為唯一優先目標，先完成可用、可控、可驗證的最小閉環。

本階段 adapter 優先順序固定為：

1. `codex`
2. `claude-code`
3. `api-fallback`

除上述三者外，其餘工具（例如 Cursor Agent、Gemini CLI、OpenCode、OpenClaw、Comet workflow 深度整合）全部延後到後續 phase 再評估，不納入本階段交付範圍。

## 2. 範圍定義（In / Out）

### In Scope（P0 必做）

- 提供一個對 Perplexity 可用的 MCP server 介面（local-first，保留 remote-ready 設計）。
- 打通 `codex`、`claude-code`、`api-fallback` 三個 adapter 的最小執行路徑：
  - `detect`
  - `capabilities`
  - `run`
  - `cancel`（最小可用）
- 提供設計需求文檔生成相關 MCP tools（read/write 限定於 project scope）。
- 安全邊界：禁止超出工作目錄的任意讀寫、禁止無限制 shell 執行。

### Out of Scope（P0 不做）

- 其他 adapter 的正式支援與品質保證。
- Comet 特化自動化流程（例如 browser-side orchestration）。
- 跨組織多租戶 remote control plane。
- 高風險工具（任意命令執行、全檔案系統寫入）。

## 3. 架構策略

### 3.1 Host 策略

- **Primary host**：Perplexity Mac App（local MCP）。
- **Secondary host**：Perplexity remote connector（後續 P1 可開）。
- Comet 只作為後續 workflow 擴充對象，不影響 P0 架構。

### 3.2 Adapter 策略（固定順序）

1. `codex`：
   - 先完成 Perplexity MCP 工具觸發下的穩定執行。
   - 使用現有 runtime-adapter 能力（`exec --json` 路徑）做最小整合。
2. `claude-code`：
   - 使用既有 stream-json 能力做事件映射。
3. `api-fallback`：
   - 作為無本機 CLI 或 auth 失敗時的降級路徑。

### 3.3 MCP Tool 面

P0 僅提供以下工具類型：

- Discovery:
  - `od_agents_list`
  - `od_skills_list`
- Planning:
  - `od_route_task`
  - `od_generate_design_brief`
- Execution:
  - `od_run_agent`（adapter 僅限三優先）
  - `od_cancel_run`
- Document:
  - `od_write_requirement_doc`
  - `od_read_project_doc`

## 4. 安全與治理

- 路徑限制：所有讀寫必須位於 `PROJECT_ROOT` 或 `.od/projects/<projectId>/`。
- Tool allowlist：MCP 僅暴露白名單工具，不透傳任意 shell。
- Adapter allowlist：P0 僅允許 `codex`、`claude-code`、`api-fallback`。
- 審計紀錄：每次 run 記錄 `agentId`、`tool`、`cwd`、`timestamp`、`status`。
- 失敗策略：
  - `codex` 或 `claude-code` 不可用時，回報可診斷訊息，必要時降級 `api-fallback`。

## 5. 交付物

### 5.1 文件

- 本文件：`specs/current/perplexity-mcp-priority-plan-zh-tw.md`
- 後續實作文件：
  - `specs/current/perplexity-mcp-tool-schema.md`
  - `specs/current/perplexity-mcp-rollout-checklist.md`

### 5.2 實作（預期）

- daemon 新增 MCP server entry（或對應 module）。
- MCP tool handlers（上述 P0 清單）。
- adapter gating（只允許三優先）。
- 最小 e2e 驗收腳本（local host + one remote-ready smoke path）。

## 6. 驗收標準（P0 Exit Criteria）

需全部成立才可視為完成：

1. Perplexity local MCP 可成功連線並呼叫 `od_agents_list`。
2. 可由 Perplexity 呼叫 `od_generate_design_brief` 並寫入 project 文件。
3. 三優先 adapter 可被列出，且至少兩者可在本機成功執行一個最小任務。
4. 任意越界路徑讀寫會被拒絕並返回明確錯誤。
5. 未在 allowlist 的 adapter 無法被 `od_run_agent` 觸發。

## 7. 執行順序（建議）

1. 建立 MCP server skeleton + health tool。
2. 完成 tool schema（先 discovery/planning/document，後 execution）。
3. 接入 adapter gating（三優先固定）。
4. 做 Perplexity local connector 實機驗證。
5. 補齊 rollout checklist 與錯誤診斷文案。

## 8. 決策原則

- 以 Perplexity 可用性為唯一優先，不為泛用而犧牲交付速度。
- 先做 local-first，可運作後再推進 remote。
- adapter 擴張嚴格 phase 化；P0 不受新工具需求干擾。

