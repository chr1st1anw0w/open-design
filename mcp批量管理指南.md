# mcp批量管理指南

本指南對應「一次批量匯入，後續改用 Codex App UI 維護」流程。

## 一次完成設置（單行）

```bash
node /Users/christianwu/open-design/scripts/mcp-batch-import.mjs --from /Users/christianwu/open-design/mcp.json --to /Users/christianwu/.codex/config.toml
```

執行效果：
- 讀取 `/Users/christianwu/open-design/mcp.json`
- 自動備份 `/Users/christianwu/.codex/config.toml`（`.bak.<timestamp>`）
- 移除舊的 `mcp_servers.*` 區塊
- 一次寫入新的 MCP 設定

## 管理來源檔（JSON）

- 主來源：`/Users/christianwu/open-design/mcp.json`
- 你習慣的日後維護方式：只改 `mcp.json`，再重跑上方單行命令

## 全域預設開關策略

以下會在全域 `~/.codex/config.toml` 載入，對所有專案生效。

預設啟用（常用/重要）：
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 
- 

預設停用（按需開啟）：
- `figma`
- `sequential-thinking`
- `v0`
- `render`
- `framer`
- `stitch`

## `.env` 使用規則

- 以 `config.toml` 內 `${VAR_NAME}` 方式引用
- 目前模板已配置：
- `NOTION_TOKEN`
- `NOTION_DATABASE_ID`
- `MAGIC_API_KEY`

若要新增新 MCP 的 API key，只要先補到 `/Users/christianwu/.codex/.env`，再在 `mcp.json` 對應 `env` 欄位引用即可。

## Model Provider（Gemini / Antigravity）

全域已加在 `/Users/christianwu/.codex/config.toml`：
- `model_providers.gemini_proxy` -> `GEMINI_API_KEY_ACTIVE`
- `model_providers.antigravity_proxy` -> `ANTIGRAVITY_API_KEY_ACTIVE`

可用 profiles（mode）：
- `gemini_3_1_pro_hight`
- `gemini_3_1_pro_low`
- `gemini_3_flash`
- `claude_sonnet_4_6_thinking`
- `claude_opus_4_6_thinking`
- `gpt_oss_120b_medium`

## Key 輪替策略（.env）

已採大寫與底線命名，供 TOML 偵測：
- `GEMINI_API_KEY_ACTIVE`
- `GEMINI_API_KEY_FALLBACK_1`
- `GEMINI_API_KEY_FALLBACK_2`
- `ANTIGRAVITY_API_KEY_ACTIVE`
- `ANTIGRAVITY_API_KEY_FALLBACK_1`
- `ANTIGRAVITY_API_KEY_FALLBACK_2`

切換 key 時只改 `*_ACTIVE`，不需改 `config.toml`。
