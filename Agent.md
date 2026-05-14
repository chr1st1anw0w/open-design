# Open Design Node / pnpm 環境修正筆記

> 此文件為本機環境操作筆記，已加入 `.gitignore`，不應提交到 Git（版本控制系統）。

## 1. 問題背景

Open Design 專案要求使用：

- Node（執行環境）：`~24`
- pnpm（套件管理器）：`10.33.x`
- 專案 `package.json` 已透過 `packageManager` 指定 `pnpm@10.33.2`

若執行 `pnpm tools-dev restart` 時看到目前 Node 仍指向：

```bash
/Users/christianwu/.nvm/versions/node/v22.20.0/bin/node
```

代表目前 shell（終端機工作階段）的 `PATH`（執行檔搜尋路徑）仍優先使用 Node v22，導致 `Unsupported engine` 警告，以及 `@open-design/desktop` 或 native module（原生模組，例如 `better-sqlite3`）建置失敗。

## 2. 為什麼安裝 Node v24 後仍會用到 v22

`nvm`（Node Version Manager，Node 版本管理器）安裝新版 Node 後，不會必然切換目前 shell 使用的版本。

常見原因包含：

1. 已執行 `nvm install 24`，但尚未執行 `nvm use 24`。
2. 未設定 `nvm alias default 24`，新開 shell 仍回到舊版本。
3. `corepack`（Node 內建套件管理器代理）曾在 Node v22 下啟用，`pnpm` shim（代理執行檔）仍解析到 v22 路徑。
4. `package.json#packageManager` 被錯誤改成 `pnpm@11.x`，但 `engines.pnpm` 仍要求 `<11`，造成 Corepack 啟動不相容版本。
5. `zsh` / `bash` 保留舊指令路徑快取，需要執行 `hash -r` 或重新開啟終端機。

## 3. 何時需要執行完整修正流程

完整清理與重新安裝流程**不是每次開發都要執行**。

只在以下情境執行：

- 第一次修正 Node v22 → Node v24 的環境衝突。
- Node major version（主版本）變更，例如 v22 切到 v24。
- 出現 native module ABI（二進位介面）不相容，例如 `better-sqlite3` 無法載入。
- `pnpm install` 後仍出現 `Unsupported engine` 或 desktop build failure（桌面端建置失敗）。

日常開發只需要確認版本正確後執行 `pnpm tools-dev` 或相關 `tools-dev` 命令。

## 3.1 pnpm v11 衝突修復經驗

若錯誤訊息顯示：

```bash
Expected version: >=10.33.2 <11
Got: 11.0.9
```

優先檢查根目錄 `package.json`：

```bash
node -p "require('./package.json').packageManager"
node -p "require('./package.json').engines.pnpm"
```

正確狀態應為：

```bash
pnpm@10.33.2
>=10.33.2 <11
```

若 `packageManager` 顯示 `pnpm@11.x`，請先把它改回：

```json
"packageManager": "pnpm@10.33.2"
```

然後重新啟用 Corepack，並強制把目前 Node v24 的 Corepack global pnpm（全域預設 pnpm）固定回 `10.33.2`：

```bash
corepack enable
corepack install --global pnpm@10.33.2
corepack prepare pnpm@10.33.2 --activate
hash -r
pnpm -v
```

注意：不要依照錯誤訊息直接執行 `pnpm i -g pnpm` 來安裝最新版 pnpm，因為最新版可能是 `pnpm@11.x`，反而會違反本專案 `engines.pnpm` 的 `<11` 限制。

如果已修正 `package.json`，但同一個舊 terminal 執行 `pnpm -v` 仍顯示 `11.0.9`，通常是 shell cache（指令快取）或 Corepack active version（目前啟用版本）尚未刷新。請在該 terminal 執行：

```bash
corepack enable
corepack install --global pnpm@10.33.2
corepack prepare pnpm@10.33.2 --activate
hash -r
pnpm --version
```

若仍顯示 `11.0.9`，直接關閉該 terminal 並開新的 shell，再重新執行：

```bash
cd /Users/christianwu/open-design
nvm use 24
pnpm --version
```

## 4. 一次性永久修正流程

在專案根目錄 `/Users/christianwu/open-design` 執行：

```bash
cd /Users/christianwu/open-design

export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"

nvm install 24
nvm alias default 24
nvm use 24
hash -r

corepack enable
corepack install --global pnpm@10.33.2
corepack prepare pnpm@10.33.2 --activate
hash -r

node -v
pnpm -v
which node
which pnpm
```

預期結果：

- `node -v` 顯示 `v24.x.x`
- `pnpm -v` 顯示 `10.33.2`
- `which node` 指向 `~/.nvm/versions/node/v24.../bin/node`
- `which pnpm` 指向 `~/.nvm/versions/node/v24.../bin/pnpm`

## 5. 只在必要時執行的清理與重裝

以下命令會移除 `node_modules` 並重新安裝依賴，成本較高，**不要在每次啟動前重跑**。

```bash
cd /Users/christianwu/open-design

pnpm tools-dev stop || true

find . -name node_modules -type d -prune -exec rm -rf '{}' +

pnpm store prune || true
pnpm install
pnpm --filter @open-design/daemon rebuild better-sqlite3
pnpm --filter @open-design/daemon exec node -e "require('better-sqlite3'); console.log('better-sqlite3 OK')"
```

適用時機：

- 已切換 Node major version。
- native module（原生模組）載入失敗。
- `pnpm install` 沿用舊 Node ABI（二進位介面）造成錯誤。

## 6. 日常開發流程

日常開發通常只需：

```bash
cd /Users/christianwu/open-design

export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use 24
hash -r

node -v
pnpm -v

pnpm tools-dev
```

若已重新開啟終端機且 `nvm alias default 24` 生效，可省略 `nvm use 24`，但仍建議用 `node -v` 與 `pnpm -v` 快速確認。

## 7. 驗證目前 shell 是否完全正確

在同一個準備執行 `pnpm tools-dev` 的 shell 中執行：

```bash
echo "node version: $(node -v)"
echo "pnpm version: $(pnpm -v)"
echo "node path: $(which node)"
echo "pnpm path: $(which pnpm)"

node -p "process.execPath"
node -p "process.version"
pnpm exec node -p "process.execPath"
pnpm exec node -p "process.version"
```

全部結果都應指向 Node v24。若 `pnpm exec node -p "process.version"` 仍顯示 v22，代表 `pnpm` 或 shell `PATH` 仍未切換乾淨。

## 8. 若仍看到 v22 的排查命令

檢查 `PATH` 順序：

```bash
echo "$PATH" | tr ':' '\n' | nl
```

檢查 `node` / `pnpm` 解析來源：

```bash
type -a node
type -a pnpm
hash -r
type -a node
type -a pnpm
```

若 `type -a node` 或 `type -a pnpm` 第一個仍是 v22 路徑，重新執行：

```bash
nvm use 24
corepack enable
corepack prepare pnpm@10.33.2 --activate
hash -r
```

## 9. shell 初始化建議

確認 `~/.zshrc` 包含：

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && . "$NVM_DIR/bash_completion"
```

修改後執行：

```bash
source ~/.zshrc
nvm use default
node -v
```

## 10. Open Design 預設開發命令

```bash
pnpm tools-dev                 # daemon + web + desktop in the background
pnpm tools-dev start web       # daemon + web in the background
pnpm tools-dev run web         # daemon + web in the foreground (e2e/dev server)
pnpm tools-dev restart         # restart daemon + web + desktop
pnpm tools-dev restart --daemon-port 7457 --web-port 5175
pnpm tools-dev status          # inspect managed runtimes
pnpm tools-dev logs            # show daemon/web/desktop logs
pnpm tools-dev check           # status + recent logs + common diagnostics
pnpm tools-dev stop            # stop managed runtimes
pnpm --filter @open-design/daemon build  # build apps/daemon/dist/cli.js for `od`
pnpm --filter @open-design/web build     # build the web package when needed
pnpm typecheck                 # workspace typecheck
```
