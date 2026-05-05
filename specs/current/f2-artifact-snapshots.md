# F2 — Artifact 版本快照 / 復原

**狀態：** 待開發（等待 Codex）  
**優先：** P0  
**預估工作量：** 5–7 天  
**影響範圍：** `apps/daemon/src/projects.ts` · `apps/daemon/src/server.ts` · `apps/web/src/components/FileViewer.tsx`

---

## 問題陳述

Agent 在修改 HTML artifact 時會直接覆寫檔案（`writeProjectFile()` 呼叫 `writeFile()`）。
使用者沒有辦法：
- 回到 agent 改壞之前的版本
- 比較兩個版本的差異
- 在多次迭代後選擇最好的版本

這是使用者最常抱怨的問題之一，也是 AI 設計工具的核心體驗缺口。

---

## 目標

1. 每次 agent 寫入檔案前，自動建立快照
2. 前端 FileViewer 顯示「版本歷史」按鈕
3. 使用者可以預覽任意版本並一鍵復原
4. 快照數量上限：每個檔案保留最近 20 個版本（自動清理舊版本）
5. 快照不影響現有的 ZIP 匯出（排除 `.snapshots/` 目錄）

---

## 技術設計

### 快照儲存結構

```
.od/projects/<projectId>/
├── index.html                    ← 當前版本（現有）
├── assets/
│   └── logo.png
└── .snapshots/                   ← 新增（dotfile，不出現在 listFiles）
    └── index.html/
        ├── 1746432000000.html    ← Unix ms timestamp
        ├── 1746432060000.html
        └── 1746432120000.html
```

快照目錄以 `.` 開頭，`listFiles()` 已有 `if (e.name.startsWith('.')) continue` 邏輯，自動排除。

### 後端：`apps/daemon/src/projects.ts`

**新增快照函式：**

```typescript
const MAX_SNAPSHOTS_PER_FILE = 20;

export async function snapshotProjectFile(
  projectsRoot: string,
  projectId: string,
  name: string,
): Promise<void> {
  const dir = projectDir(projectsRoot, projectId);
  const sourcePath = resolveSafe(dir, name);

  // 檔案不存在時不需要快照（第一次寫入）
  try {
    await stat(sourcePath);
  } catch {
    return;
  }

  const snapshotDir = path.join(dir, '.snapshots', name);
  await mkdir(snapshotDir, { recursive: true });

  const ts = Date.now();
  const ext = path.extname(name) || '';
  const snapshotPath = path.join(snapshotDir, `${ts}${ext}`);

  const content = await readFile(sourcePath);
  await writeFile(snapshotPath, content);

  // 清理超過上限的舊快照
  await pruneSnapshots(snapshotDir, MAX_SNAPSHOTS_PER_FILE);
}

async function pruneSnapshots(snapshotDir: string, maxCount: number): Promise<void> {
  let entries: string[] = [];
  try {
    entries = await readdir(snapshotDir);
  } catch {
    return;
  }
  // 按時間戳排序（檔名即時間戳）
  const sorted = entries
    .filter(e => /^\d+/.test(e))
    .sort((a, b) => parseInt(a) - parseInt(b));

  if (sorted.length <= maxCount) return;

  const toDelete = sorted.slice(0, sorted.length - maxCount);
  await Promise.all(
    toDelete.map(f => unlink(path.join(snapshotDir, f)).catch(() => {}))
  );
}

export async function listSnapshots(
  projectsRoot: string,
  projectId: string,
  name: string,
): Promise<SnapshotEntry[]> {
  const dir = projectDir(projectsRoot, projectId);
  const snapshotDir = path.join(dir, '.snapshots', name);

  let entries: string[] = [];
  try {
    entries = await readdir(snapshotDir);
  } catch {
    return [];
  }

  const snapshots = await Promise.all(
    entries
      .filter(e => /^\d+/.test(e))
      .sort((a, b) => parseInt(b) - parseInt(a)) // 最新在前
      .map(async (filename) => {
        const fullPath = path.join(snapshotDir, filename);
        const st = await stat(fullPath).catch(() => null);
        const ts = parseInt(filename);
        return st ? {
          timestamp: ts,
          filename,
          size: st.size,
        } : null;
      })
  );

  return snapshots.filter(Boolean) as SnapshotEntry[];
}

export async function restoreSnapshot(
  projectsRoot: string,
  projectId: string,
  name: string,
  timestamp: number,
): Promise<void> {
  const dir = projectDir(projectsRoot, projectId);
  const ext = path.extname(name) || '';
  const snapshotPath = path.join(dir, '.snapshots', name, `${timestamp}${ext}`);

  // 驗證快照存在
  await stat(snapshotPath); // throws if not found

  // 先對當前版本建立快照（復原前保存）
  await snapshotProjectFile(projectsRoot, projectId, name);

  // 復原
  const content = await readFile(snapshotPath);
  const targetPath = resolveSafe(dir, name);
  await writeFile(targetPath, content);
}
```

**修改 `writeProjectFile()` — 在寫入前自動快照：**

```typescript
export async function writeProjectFile(
  projectsRoot: string,
  projectId: string,
  name: string,
  body: Buffer | string,
  { overwrite = true, artifactManifest = null, snapshot = true } = {},
) {
  // 寫入前自動快照（只對已存在的檔案）
  if (snapshot && overwrite) {
    await snapshotProjectFile(projectsRoot, projectId, name).catch(() => {});
  }

  // ... 現有邏輯不變 ...
}
```

### 後端：`apps/daemon/src/server.ts` — 新增端點

```typescript
// GET /api/projects/:id/files/:path/snapshots
// 列出某個檔案的所有快照
app.get('/api/projects/:id/files/*/snapshots', async (req, res) => {
  const filePath = req.params[0];
  try {
    const snapshots = await listSnapshots(PROJECTS_DIR, req.params.id, filePath);
    res.json({ snapshots });
  } catch (err) {
    sendApiError(res, 500, 'INTERNAL_ERROR', String(err));
  }
});

// GET /api/projects/:id/files/:path/snapshots/:timestamp
// 讀取特定快照的內容（用於預覽）
app.get('/api/projects/:id/files/*/snapshots/:timestamp', async (req, res) => {
  const filePath = req.params[0];
  const ts = parseInt(req.params.timestamp);
  if (!Number.isFinite(ts)) {
    return sendApiError(res, 400, 'BAD_REQUEST', 'invalid timestamp');
  }
  try {
    const dir = projectDir(PROJECTS_DIR, req.params.id);
    const ext = path.extname(filePath) || '';
    const snapshotPath = path.join(dir, '.snapshots', filePath, `${ts}${ext}`);
    const content = await readFile(snapshotPath);
    res.setHeader('Content-Type', mimeFor(filePath));
    res.send(content);
  } catch (err) {
    sendApiError(res, 404, 'NOT_FOUND', 'snapshot not found');
  }
});

// POST /api/projects/:id/files/:path/snapshots/:timestamp/restore
// 復原到特定快照
app.post('/api/projects/:id/files/*/snapshots/:timestamp/restore', async (req, res) => {
  const filePath = req.params[0];
  const ts = parseInt(req.params.timestamp);
  if (!Number.isFinite(ts)) {
    return sendApiError(res, 400, 'BAD_REQUEST', 'invalid timestamp');
  }
  try {
    await restoreSnapshot(PROJECTS_DIR, req.params.id, filePath, ts);
    res.json({ ok: true, restoredAt: ts });
  } catch (err) {
    sendApiError(res, 404, 'NOT_FOUND', 'snapshot not found');
  }
});
```

### 前端：`apps/web/src/components/FileViewer.tsx`

在 FileViewer 的工具列新增「版本歷史」按鈕（時鐘圖示），點擊後展開側邊欄：

```tsx
// 版本歷史側邊欄狀態
const [showHistory, setShowHistory] = useState(false);
const [snapshots, setSnapshots] = useState<SnapshotEntry[]>([]);
const [previewSnapshot, setPreviewSnapshot] = useState<number | null>(null);

// 載入快照列表
useEffect(() => {
  if (!showHistory || !projectId || !fileName) return;
  fetch(`/api/projects/${projectId}/files/${encodeURIComponent(fileName)}/snapshots`)
    .then(r => r.json())
    .then(data => setSnapshots(data.snapshots ?? []));
}, [showHistory, projectId, fileName]);

// 復原快照
async function handleRestore(timestamp: number) {
  if (!confirm(t('fileViewer.restoreConfirm'))) return;
  await fetch(
    `/api/projects/${projectId}/files/${encodeURIComponent(fileName)}/snapshots/${timestamp}/restore`,
    { method: 'POST' }
  );
  onFileChange?.(); // 觸發重新載入
  setShowHistory(false);
}
```

**版本歷史側邊欄 UI：**

```tsx
{showHistory && (
  <div className="snapshot-panel">
    <div className="snapshot-panel-head">
      <strong>{t('fileViewer.versionHistory')}</strong>
      <button onClick={() => setShowHistory(false)}>
        <Icon name="close" size={14} />
      </button>
    </div>
    {snapshots.length === 0 ? (
      <p className="snapshot-empty">{t('fileViewer.noSnapshots')}</p>
    ) : (
      <ul className="snapshot-list">
        {snapshots.map(snap => (
          <li key={snap.timestamp} className="snapshot-item">
            <span className="snapshot-time">
              {formatRelativeTime(snap.timestamp)}
            </span>
            <span className="snapshot-size">
              {formatBytes(snap.size)}
            </span>
            <button
              className="snapshot-preview"
              onClick={() => setPreviewSnapshot(snap.timestamp)}
            >
              {t('common.preview')}
            </button>
            <button
              className="snapshot-restore"
              onClick={() => handleRestore(snap.timestamp)}
            >
              {t('fileViewer.restore')}
            </button>
          </li>
        ))}
      </ul>
    )}
  </div>
)}
```

### i18n 新增鍵值

```typescript
// en.ts
'fileViewer.versionHistory': 'Version history',
'fileViewer.noSnapshots': 'No snapshots yet.',
'fileViewer.restore': 'Restore',
'fileViewer.restoreConfirm': 'Restore this version? The current file will be saved as a new snapshot.',

// zh-TW.ts
'fileViewer.versionHistory': '版本歷史',
'fileViewer.noSnapshots': '尚無快照。',
'fileViewer.restore': '復原',
'fileViewer.restoreConfirm': '復原到這個版本？目前的檔案會先儲存為新快照。',
```

---

## 資料型別（`packages/contracts`）

```typescript
export interface SnapshotEntry {
  timestamp: number;   // Unix ms
  filename: string;    // e.g. "1746432000000.html"
  size: number;        // bytes
}

export interface ListSnapshotsResponse {
  snapshots: SnapshotEntry[];
}

export interface RestoreSnapshotResponse {
  ok: boolean;
  restoredAt: number;
}
```

---

## 邊界條件

| 情境 | 處理方式 |
|---|---|
| 第一次寫入（檔案不存在） | 不建立快照，直接寫入 |
| 快照目錄寫入失敗 | 靜默忽略（不阻斷主要寫入） |
| 復原時快照不存在 | 回傳 404 |
| 復原時目標檔案不存在 | 直接寫入（相當於從快照建立） |
| ZIP 匯出 | `.snapshots/` 以 `.` 開頭，`collectArchiveEntries()` 已排除 |
| Vercel 部署 | 快照是本地 daemon 功能，Topology C 不支援（前端隱藏按鈕） |

---

## 測試計畫

| 測試類型 | 測試案例 |
|---|---|
| 單元測試 | `snapshotProjectFile()` 建立正確路徑的快照 |
| 單元測試 | `pruneSnapshots()` 超過 20 個時刪除最舊的 |
| 單元測試 | `restoreSnapshot()` 復原前先建立快照 |
| 整合測試 | `writeProjectFile()` 呼叫後快照存在 |
| 整合測試 | GET /snapshots 回傳正確列表 |
| 整合測試 | POST /restore 後檔案內容變更 |

---

## Codex 提示詞

```
你是 Open Design 專案的開發者。請根據以下 spec 實作「Artifact 版本快照 / 復原」功能。

## 任務概述
在 open-design 專案中實作自動快照功能，讓使用者可以復原 agent 修改過的檔案。

## 需要修改的檔案

### 1. apps/daemon/src/projects.ts
新增以下函式：
- snapshotProjectFile(projectsRoot, projectId, name): 在 .snapshots/<name>/ 目錄建立時間戳快照
- pruneSnapshots(snapshotDir, maxCount): 保留最新 20 個，刪除舊的
- listSnapshots(projectsRoot, projectId, name): 回傳快照列表（最新在前）
- restoreSnapshot(projectsRoot, projectId, name, timestamp): 復原到指定快照（復原前先快照當前版本）

修改 writeProjectFile()：在 overwrite=true 且檔案已存在時，呼叫 snapshotProjectFile()（快照失敗不阻斷寫入）。

快照路徑格式：.od/projects/<id>/.snapshots/<filename>/<timestamp><ext>
例如：.od/projects/abc123/.snapshots/index.html/1746432000000.html

### 2. apps/daemon/src/server.ts
新增三個端點：
- GET /api/projects/:id/files/*/snapshots — 列出快照
- GET /api/projects/:id/files/*/snapshots/:timestamp — 讀取快照內容
- POST /api/projects/:id/files/*/snapshots/:timestamp/restore — 復原

注意：路由中的 * 是 Express 的萬用字元，用 req.params[0] 取得檔案路徑。

### 3. packages/contracts/src/index.ts
新增 SnapshotEntry、ListSnapshotsResponse、RestoreSnapshotResponse 型別。

### 4. apps/web/src/components/FileViewer.tsx
在工具列新增「版本歷史」按鈕（使用現有的 Icon 元件，name="clock" 或類似）。
點擊後在右側顯示快照列表側邊欄。
每筆快照顯示：相對時間、檔案大小、預覽按鈕、復原按鈕。
復原前顯示 confirm 對話框。
復原成功後重新載入檔案。

### 5. apps/web/src/i18n/locales/en.ts 和 zh-TW.ts
新增快照相關的 i18n 鍵值（見 spec）。

## 注意事項
- .snapshots/ 目錄以 . 開頭，listFiles() 已自動排除，不需要額外處理
- snapshotProjectFile() 的失敗必須靜默忽略（.catch(() => {})），不能阻斷主要寫入流程
- 快照路徑中的 <filename> 可能包含子目錄（如 assets/logo.png），需要用 path.join 正確處理
- 復原端點需要驗證 timestamp 是有效的數字

## 驗收條件
1. agent 寫入 index.html 後，.snapshots/index.html/ 目錄出現對應快照
2. GET /api/projects/:id/files/index.html/snapshots 回傳快照列表
3. POST /restore 後 index.html 內容變更為快照版本
4. 快照超過 20 個時自動清理最舊的
5. pnpm typecheck 通過
6. pnpm test 通過
```
