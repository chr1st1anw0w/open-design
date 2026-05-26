建議在 /Users/christianwu/open-design 使用這組 Codex 工作模式：

**Codex 環境參數**

```
cd /Users/christianwu/open-design nvm use 24 corepack enable corepack prepare pnpm@10.33.2 --activate 
```

**第一次進專案**

```
pnpm install 
```

**日常啟動**

```
pnpm tools-dev run web --daemon-port 17456 --web-port 17573 
```

這條已涵蓋 daemon + web。通常不需要再分開跑：

```
pnpm tools-dev pnpm tools-dev start web 
```

**如果要在 Codex 開啟專案後自動提示/執行**
建議在 repo 加一個本地啟動腳本，例如：

```
pnpm tools-dev run web --daemon-port 17456 --web-port 17573 
```

然後在 Codex 開新 session 時直接要求：

```
請先啟動 open-design dev server： cd /Users/christianwu/open-design nvm use 24 pnpm tools-dev run web --daemon-port 17456 --web-port 17573 
```

**推薦固定 URL**

* Web UI：http://127.0.0.1:17573
* GPT Image Workbench：http://127.0.0.1:17573/tools/gpt-image2/workbench
* Prompt Studio：http://127.0.0.1:17573/tools/gpt-image2/prompt-studio
* Daemon：http://127.0.0.1:17456

注意：17456 是 daemon，不是前端頁面。浏览器應開 17573。
