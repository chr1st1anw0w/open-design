# 部署與後台管理指南

本指南說明如何將 Open Design 部署到 Render、Supabase 或 Vercel，以及如何管理後台內容（如 Prompt 和 JSON）。

## 1. 部署到 Render (建議)

Render 是部署此專案最簡單的方式，因為它支援 Docker 並提供持久化磁碟（Persistent Disk），這對於保存 SQLite 資料庫和專案檔案至關重要。

### 步驟：
1. **建立專案**：在 Render Dashboard 選擇 "Blueprints" 並連結你的 GitHub 倉庫。
2. **自動配置**：專案根目錄中的 `render.yaml` 會自動配置 Web Service。
3. **設定環境變數**：
   - `ANTHROPIC_API_KEY`: 你的 Anthropic API 金鑰。
   - `OPENAI_API_KEY`: 你的 OpenAI API 金鑰。
   - `GOOGLE_API_KEY`: 你的 Google Gemini API 金鑰。
4. **持久化儲存**：`render.yaml` 已定義了一個掛載於 `/app/data` 的磁碟，所有的專案資料和資料庫都將存放在此。

## 2. 部署到 Vercel

Vercel 適合託管靜態前端，但專案包含一個後端 Daemon。你可以將前端部署到 Vercel，並將 Daemon 部署到其他地方（如 Render），然後透過環境變數連結。

### 步驟：
1. **前端部署**：Vercel 會識別專案並使用 `pnpm build` 進行建置。
2. **後端代理**：你需要設定 `NEXT_PUBLIC_DAEMON_URL` 指向你部署在其他地方的 Daemon。

> 注意：Vercel 是無狀態的（Stateless），因此無法直接執行需要 SQLite 持久化儲存的 Daemon。

## 3. 部署到 Supabase

你可以使用 Supabase 管理資料庫，但 Open Design 目前預設使用 SQLite。若要遷移到 Supabase：

1. **資料庫遷移**：需要修改 `apps/daemon/src/db.ts` 以支援 PostgreSQL (Supabase)。
2. **Edge Functions**：某些 API 代理邏輯可以遷移到 Supabase Edge Functions。

## 4. 後台內容管理

本專案的「後台」內容主要由 `skills/` (Prompt) 和 `design-systems/` (JSON/MD) 組成。

### 存取與安全性：
- **API 金鑰管理**：我們已更新 Daemon，支援從環境變數（.env）讀取 API 金鑰。這確保了金鑰不會洩漏到前端。
- **安全性**：目前的部署方式適合個人使用。若要開放給多人，建議在 Daemon 前方加入驗證層（如 Basic Auth 或 Clerk）。

### 修改 Prompt 與 JSON：
- **檔案系統**：在現階段，你可以直接在 `skills/` 目錄下新增或修改 `SKILL.md` 檔案，Daemon 會自動掃描並載入。
- **未來擴展**：若需要 UI 介面進行管理，建議將這些檔案內容遷移到資料庫中儲存，並新增管理 API。

## 故障排除

- **連線問題**：確保前端請求的 URL 與 Daemon 監聽的地址一致。
- **資料遺失**：若未設定持久化磁碟，重新部署後所有專案與對話將會消失。
