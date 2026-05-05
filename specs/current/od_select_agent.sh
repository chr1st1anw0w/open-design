# 立即可執行：新增 od_select_agent 到 MCP server
cat >> /Users/christianwu/open-design/specs/current/perplexity-agent-selector-spec.md << 'EOF'
# Spec: od_select_agent MCP Tool

## 目標
讓 Perplexity Mac App 可透過自然語言選擇 CLI Agent ID

## 工具清單
- od_select_agent(agentId, model?) → 設定 session agent
- od_get_current_agent() → 回傳目前 session agent
- od_route_task 更新 → 支援 agentId 覆寫參數

## 驗收標準
- Perplexity 輸入「@codex 幫我...」→ 路由至 codex CLI
- Perplexity 輸入「切換 agent 到 gemini」→ od_select_agent 被呼叫
- od_execution_validate_adapter(cursor-agent) → allowed: false
EOF
