# Perplexity MCP Tool Schema（P0）

## 1. 適用範圍

本文件定義 `od mcp perplexity`（local-first）在 P0 階段的 MCP tool schema。  
P0 adapter gating 固定：

1. `codex`
2. `claude-code`
3. `api-fallback`

## 2. Tool 清單與順序

依實際執行順序分組：

### A. Discovery

1. `od_health`
2. `od_agents_list`
3. `od_skills_list`

### B. Planning / Document

1. `od_route_task`
2. `od_generate_design_brief`
3. `od_write_requirement_doc`
4. `od_read_project_doc`

### C. Execution（P0 控管）

1. `od_execution_validate_adapter`
2. `od_run_agent`（P0 為 gated placeholder，先不開放通用執行）

## 3. Tool I/O Schema

### `od_health`

- Input: `{}`
- Output:
  - `ok: boolean`
  - `server: string`
  - `version: string`
  - `protocolVersion: string`
  - `projectRoot: string`

### `od_agents_list`

- Input: `{}`
- Output:
  - `priorityOrder: string[]`
  - `adapters: { id, runtimeId, name, available, isPriority }[]`

### `od_skills_list`

- Input: `{}`
- Output:
  - `count: number`
  - `skills: { id, mode, scenario, description }[]`

### `od_route_task`

- Input:
  - `request: string` (required)
- Output:
  - `lane: string`
  - `recommendedSkill: string`
  - `nextSkill?: string`
  - `fallbackSkill?: string`

### `od_generate_design_brief`

- Input:
  - `title: string` (required)
  - `goal: string` (required)
  - `audience?: string`
  - `constraints?: string[]`
  - `outputPath?: string`
- Output:
  - `ok: boolean`
  - `outputPath: string` (absolute path under project root)

### `od_write_requirement_doc`

- Input:
  - `outputPath: string` (required)
  - `content: string` (required)
- Output:
  - `ok: boolean`
  - `outputPath: string`
  - `bytes: number`

### `od_read_project_doc`

- Input:
  - `inputPath: string` (required)
- Output:
  - `ok: boolean`
  - `inputPath: string`
  - `content: string`

### `od_execution_validate_adapter`

- Input:
  - `adapterId: "codex" | "claude-code" | "api-fallback"` (required)
- Output:
  - `adapterId: string`
  - `runtimeId: string | null`
  - `allowed: boolean`
  - `reason: string`

### `od_run_agent`

- Input:
  - `adapterId: "codex" | "claude-code" | "api-fallback"` (required)
  - `task: string` (required)
- Output（P0）:
  - `ok: false`
  - `status: "not_implemented"`
  - `adapterId: string`
  - `runtimeId: string`
  - `message: string`

## 4. 安全限制

- 所有檔案讀寫必須位於 `projectRoot` 內。
- `path escapes project root` 一律拒絕。
- P0 execution 僅允許三優先 adapter schema；其餘 adapter 不接受。

## 5. 後續擴展（P1）

- 將 `od_run_agent` 接到真正 execution transport（`/api/chat` or internal runtime service）。
- 加入 run lifecycle：`runId`、`cancel`、`status`。
- 在保持 gating 前提下再評估新增 adapter。

