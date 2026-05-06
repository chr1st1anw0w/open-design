# Claude Code MCP 配置提示詞 | Codex Configuration Guide

> 此提示詞格式化了 `~/.claude/settings.json` 的配置，便於 Codex 複製設定。
> 使用方式：複製相應區塊到 Codex 的 `settings.json` 中。

---

## 核心設定 | Core Settings

```json
{
  "includeCoAuthoredBy": true,
  "model": "haiku",
  "language": "traditional chinese",
  "voiceEnabled": false,
  "theme": "auto",
  "autoCompactWindow": 60000,
  "statusLine": {
    "enabled": true,
    "command": "curl -s http://localhost:17456/status 2>/dev/null | jq -r '.summary' || echo '⚡ Claude Code'"
  }
}
```

---

## 權限設定 | Permissions

### Bash 指令白名單（精選）

```json
{
  "permissions": {
    "bash": [
      "pnpm install",
      "pnpm add",
      "pnpm remove",
      "pnpm build",
      "pnpm dev",
      "pnpm test",
      "pnpm run",
      "npm install",
      "npm run",
      "yarn install",
      "yarn run",
      "bun install",
      "bun run",
      "git status",
      "git add",
      "git commit",
      "git push",
      "git pull",
      "git log",
      "git branch",
      "git checkout",
      "git diff",
      "git reset",
      "gh pr create",
      "gh pr view",
      "gh issue create",
      "node",
      "python3",
      "ls",
      "cd",
      "mkdir",
      "rm",
      "mv",
      "cp",
      "cat",
      "grep",
      "find",
      "which",
      "echo"
    ]
  }
}
```

### WebFetch 允許域名

```json
{
  "webFetch": {
    "allowed": [
      "*.github.com",
      "raw.githubusercontent.com",
      "*.npm.org",
      "*.npmjs.com",
      "registry.npmjs.org",
      "cdn.jsdelivr.net",
      "*.vercel.app",
      "vercel.com",
      "*.figma.com",
      "figma.com",
      "api.github.com",
      "stackoverflow.com",
      "mdn.mozilla.org",
      "nodejs.org",
      "react.dev",
      "nextjs.org"
    ]
  }
}
```

---

## MCP 伺服器配置 | MCP Servers

### 必備伺服器組合

```json
{
  "mcpServers": {
    "figma": {
      "command": "npx",
      "args": ["-y", "@figma/mcp@latest"],
      "env": {
        "FIGMA_ACCESS_TOKEN": "${FIGMA_ACCESS_TOKEN}"
      }
    },
    "obsidian-git": {
      "command": "node",
      "args": ["/path/to/obsidian-git-mcp.js"],
      "env": {
        "OBSIDIAN_VAULT_PATH": "${HOME}/Library/Mobile Documents/iCloud~md~obsidian/Documents"
      }
    },
    "notebooklm-mcp": {
      "command": "npx",
      "args": ["-y", "notebooklm-mcp"],
      "env": {
        "NOTEBOOKLM_HL": "zh-TW"
      }
    },
    "github-api": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GH_TOKEN}"
      }
    },
    "google-drive": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-google-drive"],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "${HOME}/.credentials/google-drive.json"
      }
    }
  }
}
```

---

## Hooks 系統配置 | Hooks Lifecycle

### SessionStart Hook（會話啟動）

```json
{
  "hooks": {
    "SessionStart": [
      {
        "name": "Load git status",
        "command": "git status --short 2>/dev/null || true",
        "description": "初始化顯示 Git 狀態"
      },
      {
        "name": "Check node version",
        "command": "node --version && pnpm --version || true",
        "description": "驗證開發環境"
      }
    ]
  }
}
```

### PreToolUse Hook（工具使用前）

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write",
        "command": "python3 ~/.claude/hooks/block-secrets.py",
        "description": "攔截包含密鑰的檔案寫入"
      },
      {
        "matcher": "Bash",
        "command": "echo '[HOOK] Executing: $COMMAND' 1>&2",
        "description": "記錄 Bash 命令執行"
      }
    ]
  }
}
```

### PostToolUse Hook（工具使用後）

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "command": "pnpm prettier --write \"$FILE_PATH\" 2>/dev/null || true",
        "description": "自動格式化編輯後的檔案"
      },
      {
        "matcher": "Write|Edit",
        "command": "pnpm eslint --fix \"$FILE_PATH\" 2>/dev/null || true",
        "description": "自動修復 ESLint 問題"
      }
    ]
  }
}
```

### Stop Hook（會話結束）

```json
{
  "hooks": {
    "Stop": [
      {
        "name": "Final build check",
        "command": "pnpm build 2>&1 | tail -20",
        "description": "會話結束時驗證產品構建"
      }
    ]
  }
}
```

---

## 插件設定 | Enabled Plugins

```json
{
  "enabledPlugins": ["skill-creator", "frontend-design", "typescript-lsp"],
  "disabledPlugins": ["figma-plugin", "superpowers", "ecc"],
  "extraKnownMarketplaces": [
    {
      "name": "ecc",
      "url": "https://raw.githubusercontent.com/anthropics/ecc-skills/main/manifest.json"
    }
  ]
}
```

---

## 工作區設定 | Workspace

```json
{
  "workspaceRoot": "/Users/christianwu/open-design",
  "contextInclude": [
    "skills/**/*.md",
    "skills/**/*.json",
    ".claude/CLAUDE.md",
    ".claude/projects/**/*.md"
  ],
  "contextExclude": ["node_modules", ".git", ".next", "dist", "build"]
}
```

---

## 快速複製模板 | Quick Copy Templates

### 最小化配置（新用戶）

```json
{
  "includeCoAuthoredBy": true,
  "model": "haiku",
  "language": "traditional chinese",
  "permissions": {
    "bash": ["pnpm", "npm", "git", "node", "python3"]
  },
  "mcpServers": {
    "github-api": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "${GH_TOKEN}" }
    }
  }
}
```

### 完整配置（生產環境）

複製上方各區塊後，在 `~/.claude/settings.json` 中合併為完整物件。

---

## 環境變數配置 | Environment Variables

建議設定以下環境變數供 MCP 伺服器使用：

```bash
export GITHUB_PERSONAL_ACCESS_TOKEN="ghp_xxxxx"
export FIGMA_ACCESS_TOKEN="fhc_xxxxx"
export GOOGLE_APPLICATION_CREDENTIALS="$HOME/.credentials/google-drive.json"
export NOTEBOOKLM_HL="zh-TW"
```

在 `~/.zshrc` 或 `~/.bashrc` 中設定，或透過 Codex 的環境變數面板管理。

---

## 驗證設定 | Verification

複製後驗證配置有效性：

```bash
# 驗證 JSON 格式
cat ~/.claude/settings.json | jq . >/dev/null && echo "✅ JSON valid"

# 檢查 MCP 伺服器連線
curl -s http://localhost:6000/health || echo "⚠️ MCP server not responding"

# 確認 Hooks 執行
pnpm --version && npm --version && node --version
```

---

**上次同步：** 2026-05-06  
**配置版本：** Claude Code MCP v2.0+
