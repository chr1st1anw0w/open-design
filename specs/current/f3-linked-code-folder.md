# F3 — 關聯程式碼目錄（本機資料夾）

**狀態：** 待開發（等待 Codex）  
**優先：** P0  
**預估工作量：** 5–7 天  
**影響範圍：** `apps/daemon/src/projects.ts` · `apps/daemon/src/server.ts` · `apps/daemon/src/db.ts` · `apps/web/src/components/ChatComposer.tsx`

---

## 問題陳述

使用者想讓 agent 讀取本機現有的程式碼目錄（例如 React 元件庫、設計稿資料夾），
但 daemon 的 `cwd` 固定在 `.od/projects/<id>/`，agent 無法讀取外部目錄。

截圖中的「關聯程式碼目錄」功能就是要解決這個問題。

---

## 目標

1. 使用者可以在「匯入」選單指定一個本機目錄路徑
2. Agent 在該專案的後續對話中可以讀取該目錄的檔案
3. 關聯目錄的路徑儲存在專案 metadata 中（跨 session 持久化）
4. 使用者可以移除關聯目錄
5. Topology C（Vercel 直連）顯示「此功能需要本機 daemon」提示

---

## 技術設計

### 關聯目錄的實作策略

根據 agent 的能力，有兩種實作路徑：

| Agent | 策略 | 說明 |
|---|---|---|
| Claude Code | `--add-dir <path>` | `agents.ts` 中 `buildArgs()` 已支援 `extraAllowedDirs` 參數 |
| Copilot | `--add-dir <path>` | 同上，Copilot 也支援 `--add-dir` |
| 其他 agent | 系統提示注入 | 在 system prompt 中告知 agent 可以讀取的目錄路徑 |

### 後端：`apps/daemon/src/db.ts` — 儲存關聯目錄

在 `projects` 表的 `metadata_json` 中儲存 `linkedDirs` 陣列（不需要新增欄位）：

```typescript
// metadata 結構擴充
interface ProjectMetadata {
  kind?: string;
  linkedDirs?: string[];  // 新增：關聯目錄的絕對路徑陣列
  // ... 其他現有欄位
}
```

### 後端：`apps/daemon/src/server.ts` — 新增端點

```typescript
// POST /api/projects/:id/linked-dirs
// 新增關聯目錄
app.post('/api/projects/:id/linked-dirs', async (req, res) => {
  const { path: dirPath } = req.body || {};
  if (!dirPath || typeof dirPath !== 'string') {
    return sendApiError(res, 400, 'BAD_REQUEST', 'path required');
  }

  // 安全驗證：路徑必須是絕對路徑且存在
  const resolved = path.resolve(dirPath);
  try {
    const st = await fs.promises.stat(resolved);
    if (!st.isDirectory()) {
      return sendApiError(res, 400, 'BAD_REQUEST', 'path is not a directory');
    }
  } catch {
    return sendApiError(res, 400, 'BAD_REQUEST', 'directory does not exist');
  }

  // 安全驗證：不允許關聯系統目錄
  const BLOCKED_PREFIXES = ['/etc', '/sys', '/proc', '/dev', os.homedir() + '/.ssh'];
  if (BLOCKED_PREFIXES.some(prefix => resolved.startsWith(prefix))) {
    return sendApiError(res, 403, 'FORBIDDEN', 'this directory cannot be linked');
  }

  const project = getProject(db, req.params.id);
  if (!project) return sendApiError(res, 404, 'PROJECT_NOT_FOUND', 'not found');

  const existing = project.metadata?.linkedDirs ?? [];
  if (existing.includes(resolved)) {
    return res.json({ project }); // 已存在，冪等
  }

  const updated = updateProject(db, req.params.id, {
    metadata: {
      ...project.metadata,
      linkedDirs: [...existing, resolved],
    },
  });
  res.json({ project: updated });
});

// DELETE /api/projects/:id/linked-dirs
// 移除關聯目錄
app.delete('/api/projects/:id/linked-dirs', (req, res) => {
  const { path: dirPath } = req.body || {};
  if (!dirPath || typeof dirPath !== 'string') {
    return sendApiError(res, 400, 'BAD_REQUEST', 'path required');
  }

  const project = getProject(db, req.params.id);
  if (!project) return sendApiError(res, 404, 'PROJECT_NOT_FOUND', 'not found');

  const existing = project.metadata?.linkedDirs ?? [];
  const updated = updateProject(db, req.params.id, {
    metadata: {
      ...project.metadata,
      linkedDirs: existing.filter(d => d !== path.resolve(dirPath)),
    },
  });
  res.json({ project: updated });
});
```

### 後端：`apps/daemon/src/server.ts` — 整合到 chat 端點

在 `/api/chat` 的 agent 呼叫中，將 `linkedDirs` 傳入 `extraAllowedDirs`：

```typescript
// 在 /api/chat 處理邏輯中，取得 linkedDirs
const project = getProject(db, projectId);
const linkedDirs = project?.metadata?.linkedDirs ?? [];

// 傳入 buildArgs（已有 extraAllowedDirs 參數）
const args = agentDef.buildArgs(
  prompt,
  imagePaths,
  [...skillDirs, ...linkedDirs],  // 合併 skill 目錄和關聯目錄
  options,
  runtimeContext,
);

// 對不支援 --add-dir 的 agent，在 system prompt 中注入提示
if (!agentDef.supportsAddDir) {
  systemPrompt += `\n\n<linked-directories>\n` +
    linkedDirs.map(d => `- ${d}`).join('\n') +
    `\n</linked-directories>\n` +
    `You may read files from the above directories using their absolute paths.`;
}
```

### 前端：`apps/web/src/components/ChatComposer.tsx`

將「關聯程式碼目錄」選單項目從 `ImportItem`（純展示）改為可互動：

```tsx
// 在 ChatComposer 的 Props 中新增
interface Props {
  // ... 現有 props
  linkedDirs?: string[];
  onLinkDir?: (path: string) => Promise<void>;
  onUnlinkDir?: (path: string) => Promise<void>;
}

// 關聯目錄選單項目
function LinkedDirItem({
  linkedDirs,
  onLinkDir,
  onUnlinkDir,
  t,
}: {
  linkedDirs: string[];
  onLinkDir: (path: string) => Promise<void>;
  onUnlinkDir: (path: string) => Promise<void>;
  t: TranslateFn;
}) {
  const [inputPath, setInputPath] = useState('');
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="import-item-expandable">
      <button
        className="import-item"
        onClick={() => setExpanded(v => !v)}
      >
        <Icon name="folder" size={14} />
        <span>{t('chat.importFolder')}</span>
        {linkedDirs.length > 0 && (
          <span className="import-item-badge">{linkedDirs.length}</span>
        )}
      </button>
      {expanded && (
        <div className="linked-dirs-panel">
          {linkedDirs.map(dir => (
            <div key={dir} className="linked-dir-row">
              <span className="linked-dir-path" title={dir}>
                {dir.split('/').slice(-2).join('/')}
              </span>
              <button
                className="linked-dir-remove"
                onClick={() => onUnlinkDir(dir)}
                title={t('common.delete')}
              >
                <Icon name="close" size={11} />
              </button>
            </div>
          ))}
          <div className="linked-dir-add">
            <input
              type="text"
              placeholder={t('chat.importFolderPlaceholder')}
              value={inputPath}
              onChange={e => setInputPath(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && inputPath.trim()) {
                  onLinkDir(inputPath.trim());
                  setInputPath('');
                }
              }}
            />
            <button
              onClick={() => {
                if (inputPath.trim()) {
                  onLinkDir(inputPath.trim());
                  setInputPath('');
                }
              }}
            >
              {t('common.create')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

### i18n 新增鍵值

```typescript
// en.ts
'chat.importFolderPlaceholder': '/path/to/your/code',
'chat.importFolderLinked': '{n} folder(s) linked',
'chat.importFolderEmpty': 'No folders linked yet.',

// zh-TW.ts
'chat.importFolderPlaceholder': '/path/to/your/code',
'chat.importFolderLinked': '已關聯 {n} 個資料夾',
'chat.importFolderEmpty': '尚未關聯任何資料夾。',
```

---

## 安全模型

| 威脅 | 緩解措施 |
|---|---|
| 路徑穿越 | 使用 `path.resolve()` 正規化，拒絕相對路徑 |
| 系統目錄存取 | 封鎖 `/etc`, `/sys`, `/proc`, `/dev`, `~/.ssh` 等前綴 |
| 不存在的目錄 | `stat()` 驗證目錄存在且為目錄 |
| Agent 越界讀取 | 依賴 agent 自身的 permission model（Claude Code `--add-dir` 只允許讀取） |
| Topology C | 前端偵測 daemon 離線時，隱藏此功能或顯示「需要本機 daemon」 |

---

## 資料型別（`packages/contracts`）

```typescript
export interface LinkDirRequest {
  path: string;
}

export interface UnlinkDirRequest {
  path: string;
}
```

---

## 測試計畫

| 測試類型 | 測試案例 |
|---|---|
| 單元測試 | POST /linked-dirs 新增有效目錄 |
| 單元測試 | POST /linked-dirs 拒絕不存在的目錄 |
| 單元測試 | POST /linked-dirs 拒絕系統目錄 |
| 單元測試 | DELETE /linked-dirs 移除目錄 |
| 整合測試 | linkedDirs 正確傳入 buildArgs 的 extraAllowedDirs |
| 整合測試 | 重新開啟專案後 linkedDirs 仍然存在 |

---

## Codex 提示詞

```
你是 Open Design 專案的開發者。請根據以下 spec 實作「關聯程式碼目錄」功能。

## 任務概述
讓使用者可以在 Open Design 的「匯入」選單中指定本機目錄，讓 agent 在後續對話中可以讀取該目錄的檔案。

## 需要修改的檔案

### 1. apps/daemon/src/server.ts
新增兩個端點：
- POST /api/projects/:id/linked-dirs — 新增關聯目錄
  - 驗證 path 是絕對路徑、存在、是目錄
  - 封鎖系統目錄（/etc, /sys, /proc, /dev, ~/.ssh）
  - 儲存到 project.metadata.linkedDirs 陣列
  - 冪等（已存在時直接回傳）
- DELETE /api/projects/:id/linked-dirs — 移除關聯目錄
  - 從 metadata.linkedDirs 中移除指定路徑

在 /api/chat 的 agent 呼叫邏輯中：
- 取得 project.metadata.linkedDirs
- 合併到 extraAllowedDirs 傳入 buildArgs()
- 對不支援 --add-dir 的 agent，在 system prompt 末尾注入 <linked-directories> 區塊

### 2. apps/web/src/components/ChatComposer.tsx
將「關聯程式碼目錄」的 ImportItem 改為可互動的展開面板：
- 顯示已關聯的目錄列表（每個有刪除按鈕）
- 輸入框讓使用者輸入新目錄路徑（Enter 或按鈕確認）
- 顯示已關聯數量的 badge

新增 Props：linkedDirs, onLinkDir, onUnlinkDir

### 3. apps/web/src/i18n/locales/en.ts 和 zh-TW.ts
新增關聯目錄相關的 i18n 鍵值（見 spec）。

### 4. packages/contracts/src/index.ts
新增 LinkDirRequest 和 UnlinkDirRequest 型別。

## 注意事項
- linkedDirs 儲存在 project.metadata.linkedDirs（JSON 欄位），不需要新增資料庫欄位
- 路徑驗證使用 path.resolve() 正規化，不要用字串比較
- 在 /api/chat 中，linkedDirs 要和現有的 skillDirs 合併，不是替換
- Topology C（daemon 離線）時，前端應隱藏此功能或顯示提示

## 驗收條件
1. POST /api/projects/:id/linked-dirs 新增有效目錄後，GET /api/projects/:id 的 metadata.linkedDirs 包含該路徑
2. 拒絕不存在的目錄（400）
3. 拒絕 /etc 等系統目錄（403）
4. 關聯目錄後，下一次 /api/chat 的 agent 呼叫包含該目錄在 extraAllowedDirs 中
5. pnpm typecheck 通過
6. pnpm test 通過
```
