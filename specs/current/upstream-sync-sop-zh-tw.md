# Upstream 同步 SOP 速查卡（zh-TW）

## 目標

- `nexu-io/open-design` 僅作為上游來源（只抓不推）。
- 所有推送只到自己的 fork。
- 每日可自動同步；有衝突時交由你審閱。

## 一次性設定

在 repo 根目錄執行：

```bash
bash scripts/upstream-sync-guard.sh setup
```

此步驟會：

1. 將 `origin` 與 `upstream` 設為 push disabled。
2. 啟用 `.githooks/pre-push`。
3. 檢查 `fork` remote 是否可用。

## 日常同步

```bash
bash scripts/upstream-sync-guard.sh sync
```

流程：

1. `fetch upstream`
2. 切到 `main`
3. 嘗試 `merge upstream/main`
4. 無衝突：自動 `push fork main`
5. 有衝突：停止並提示人工解衝突

## 快速檢查

```bash
bash scripts/upstream-sync-guard.sh status
```

顯示：

- 目前 remote 設定
- `core.hooksPath`
- 目前分支與工作樹狀態

## 衝突處理（人工）

```bash
git fetch upstream
git checkout main
git merge upstream/main
# 手動解衝突
pnpm typecheck
pnpm test
git push fork main
```

## 禁止事項

- 不可執行 `git push origin ...`（origin 已設為 disabled）。
- 不可執行 `git push upstream ...`（upstream 已設為 disabled）。
- 不可移除 pre-push 防呆 hook。
