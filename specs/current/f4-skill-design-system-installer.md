# F4 — 技能與設計系統 UI 安裝器

**狀態：** 待開發（等待 Codex）  
**優先：** P0  
**預估工作量：** 4–6 天  
**影響範圍：** `apps/daemon/src/server.ts` · `apps/daemon/src/skills.ts` · `apps/daemon/src/design-systems.ts` · `apps/web/src/components/ChatComposer.tsx`

---

## 問題陳述

安裝外部 skill 或 DESIGN.md 目前需要：
1. 手動 `git clone` 到正確目錄
2. 重啟 daemon
3. 知道正確的目錄結構

一般使用者無法完成這個流程。截圖中的「技能與設計系統」選單項目應該讓這個流程變成：
1. 貼上 git URL 或上傳 `.md` 檔案
2. 點擊安裝
3. 立即出現在選單中

---

## 目標

1. 使用者可以從 UI 安裝外部 skill（git URL）
2. 使用者可以上傳 `DESIGN.md` 或 `SKILL.md` 檔案
3. 安裝後立即重新掃描，不需要重啟 daemon
4. 顯示已安裝的 skill 和 design system 列表
5. 可以移除已安裝的項目

---

## 技術設計

### 安裝目錄策略

| 類型 | 安裝目標 | 說明 |
|---|---|---|
| Skill（git URL） | `~/.claude/skills/<repo-name>/` | 使用者全域，跨專案共用 |
| Skill（上傳 SKILL.md） | `~/.claude/skills/<name>/SKILL.md` | 單檔安裝 |
| Design System（上傳 DESIGN.md） | `~/.open-design/design-systems/<name>/DESIGN.md` | 使用者全域 |

### 後端：`apps/daemon/src/server.ts` — 新增端點

```typescript
// POST /api/skills/install
// 從 git URL 安裝 skill
app.post('/api/skills/install', async (req, res) => {
  const { url } = req.body || {};
  if (!url || typeof url !== 'string') {
    return sendApiError(res, 400, 'BAD_REQUEST', 'url required');
  }

  // 驗證 URL 格式（只允許 https://）
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return sendApiError(res, 400, 'BAD_REQUEST', 'invalid URL');
  }
  if (parsed.protocol !== 'https:') {
    return sendApiError(res, 400, 'BAD_REQUEST', 'only https:// URLs are allowed');
  }

  // 從 URL 推導 repo 名稱
  const repoName = parsed.pathname.split('/').filter(Boolean).pop()
    ?.replace(/\.git$/, '') ?? 'skill';
  const safeRepoName = repoName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 64);

  const targetDir = path.join(os.homedir(), '.claude', 'skills', safeRepoName);

  // 如果已存在，執行 git pull；否則 git clone
  const isUpdate = fs.existsSync(path.join(targetDir, '.git'));
  const gitArgs = isUpdate
    ? ['pull', '--ff-only']
    : ['clone', '--depth=1', url, targetDir];
  const gitCwd = isUpdate ? targetDir : os.homedir();

  try {
    await new Promise<void>((resolve, reject) => {
      const child = spawn('git', gitArgs, {
        cwd: gitCwd,
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 60_000,
      });
      child.on('close', code => {
        if (code === 0) resolve();
        else reject(new Error(`git exited with code ${code}`));
      });
      child.on('error', reject);
    });
  } catch (err) {
    return sendApiError(res, 500, 'INTERNAL_ERROR', `git failed: ${String(err)}`);
  }

  // 重新掃描 skills
  const skills = await listSkills(SKILLS_DIR);
  res.json({ ok: true, installed: safeRepoName, skills });
});

// POST /api/skills/upload
// 上傳 SKILL.md 檔案安裝 skill
app.post('/api/skills/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return sendApiError(res, 400, 'BAD_REQUEST', 'file required');

  const originalName = req.file.originalname;
  if (!/SKILL\.md$/i.test(originalName)) {
    fs.promises.unlink(req.file.path).catch(() => {});
    return sendApiError(res, 400, 'BAD_REQUEST', 'expected a SKILL.md file');
  }

  // 從檔案內容解析 skill name
  const content = await fs.promises.readFile(req.file.path, 'utf8');
  const { data } = parseFrontmatter(content);
  const skillName = (data.name || path.basename(req.file.originalname, '.md'))
    .replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 64);

  const targetDir = path.join(os.homedir(), '.claude', 'skills', skillName);
  await fs.promises.mkdir(targetDir, { recursive: true });
  await fs.promises.copyFile(req.file.path, path.join(targetDir, 'SKILL.md'));
  await fs.promises.unlink(req.file.path).catch(() => {});

  const skills = await listSkills(SKILLS_DIR);
  res.json({ ok: true, installed: skillName, skills });
});

// POST /api/design-systems/upload
// 上傳 DESIGN.md 安裝 design system
app.post('/api/design-systems/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return sendApiError(res, 400, 'BAD_REQUEST', 'file required');

  const originalName = req.file.originalname;
  if (!/DESIGN\.md$/i.test(originalName) && !/\.md$/i.test(originalName)) {
    fs.promises.unlink(req.file.path).catch(() => {});
    return sendApiError(res, 400, 'BAD_REQUEST', 'expected a .md file');
  }

  const dsName = path.basename(originalName, '.md')
    .replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 64);

  const targetDir = path.join(os.homedir(), '.open-design', 'design-systems', dsName);
  await fs.promises.mkdir(targetDir, { recursive: true });
  await fs.promises.copyFile(req.file.path, path.join(targetDir, 'DESIGN.md'));
  await fs.promises.unlink(req.file.path).catch(() => {});

  const designSystems = await listDesignSystems(DESIGN_SYSTEMS_DIR);
  res.json({ ok: true, installed: dsName, designSystems });
});

// DELETE /api/skills/:id
// 移除已安裝的 skill（只允許移除使用者安裝的，不允許移除內建的）
app.delete('/api/skills/:id', async (req, res) => {
  const skillId = req.params.id;
  const userSkillsDir = path.join(os.homedir(), '.claude', 'skills');
  const targetDir = path.join(userSkillsDir, skillId);

  // 安全驗證：只允許刪除 ~/.claude/skills/ 下的目錄
  if (!targetDir.startsWith(userSkillsDir + path.sep)) {
    return sendApiError(res, 403, 'FORBIDDEN', 'cannot remove built-in skills');
  }

  try {
    await fs.promises.rm(targetDir, { recursive: true, force: true });
    const skills = await listSkills(SKILLS_DIR);
    res.json({ ok: true, skills });
  } catch (err) {
    sendApiError(res, 500, 'INTERNAL_ERROR', String(err));
  }
});
```

### 前端：`apps/web/src/components/ChatComposer.tsx`

將「技能與設計系統」選單項目改為可互動的安裝面板：

```tsx
function SkillInstallerPanel({
  onInstallUrl,
  onUploadSkill,
  onUploadDesignSystem,
  t,
}: {
  onInstallUrl: (url: string) => Promise<void>;
  onUploadSkill: (file: File) => Promise<void>;
  onUploadDesignSystem: (file: File) => Promise<void>;
  t: TranslateFn;
}) {
  const [tab, setTab] = useState<'url' | 'upload'>('url');
  const [url, setUrl] = useState('');
  const [installing, setInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleInstallUrl() {
    if (!url.trim()) return;
    setInstalling(true);
    setError(null);
    try {
      await onInstallUrl(url.trim());
      setUrl('');
    } catch (err) {
      setError(String(err));
    } finally {
      setInstalling(false);
    }
  }

  return (
    <div className="skill-installer-panel">
      <div className="skill-installer-tabs">
        <button
          className={tab === 'url' ? 'active' : ''}
          onClick={() => setTab('url')}
        >
          {t('chat.importSkillsTabUrl')}
        </button>
        <button
          className={tab === 'upload' ? 'active' : ''}
          onClick={() => setTab('upload')}
        >
          {t('chat.importSkillsTabUpload')}
        </button>
      </div>

      {tab === 'url' && (
        <div className="skill-installer-url">
          <input
            type="url"
            placeholder="https://github.com/user/my-skill"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleInstallUrl()}
          />
          <button
            onClick={handleInstallUrl}
            disabled={installing || !url.trim()}
          >
            {installing ? t('common.loading') : t('chat.importSkillsInstall')}
          </button>
        </div>
      )}

      {tab === 'upload' && (
        <div className="skill-installer-upload">
          <input
            ref={fileInputRef}
            type="file"
            accept=".md"
            style={{ display: 'none' }}
            onChange={async e => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.name.toLowerCase().includes('skill')) {
                await onUploadSkill(file);
              } else {
                await onUploadDesignSystem(file);
              }
              e.target.value = '';
            }}
          />
          <button onClick={() => fileInputRef.current?.click()}>
            {t('chat.importSkillsUploadFile')}
          </button>
          <p className="skill-installer-hint">
            {t('chat.importSkillsUploadHint')}
          </p>
        </div>
      )}

      {error && (
        <p className="skill-installer-error">{error}</p>
      )}
    </div>
  );
}
```

### i18n 新增鍵值

```typescript
// en.ts
'chat.importSkillsTabUrl': 'Git URL',
'chat.importSkillsTabUpload': 'Upload file',
'chat.importSkillsInstall': 'Install',
'chat.importSkillsUploadFile': 'Choose SKILL.md or DESIGN.md',
'chat.importSkillsUploadHint': 'Upload a SKILL.md to install a skill, or a DESIGN.md to add a design system.',
'chat.importSkillsInstalled': '"{name}" installed successfully.',
'chat.importSkillsInstallFailed': 'Installation failed: {error}',

// zh-TW.ts
'chat.importSkillsTabUrl': 'Git URL',
'chat.importSkillsTabUpload': '上傳檔案',
'chat.importSkillsInstall': '安裝',
'chat.importSkillsUploadFile': '選擇 SKILL.md 或 DESIGN.md',
'chat.importSkillsUploadHint': '上傳 SKILL.md 安裝技能，或上傳 DESIGN.md 新增設計系統。',
'chat.importSkillsInstalled': '「{name}」安裝成功。',
'chat.importSkillsInstallFailed': '安裝失敗：{error}',
```

---

## 安全模型

| 威脅 | 緩解措施 |
|---|---|
| 惡意 git URL | 只允許 `https://`，不允許 `file://`, `ssh://`, `git://` |
| 路徑穿越（skill name） | `safeRepoName` 只允許 `[a-zA-Z0-9._-]`，長度上限 64 |
| 刪除內建 skill | 只允許刪除 `~/.claude/skills/` 下的目錄 |
| 上傳惡意檔案 | 只接受 `.md` 副檔名，不執行上傳的內容 |
| git clone 超時 | `timeout: 60_000`（60 秒） |

---

## 資料型別（`packages/contracts`）

```typescript
export interface InstallSkillRequest {
  url: string;
}

export interface InstallSkillResponse {
  ok: boolean;
  installed: string;
  skills: Skill[];
}
```

---

## 測試計畫

| 測試類型 | 測試案例 |
|---|---|
| 單元測試 | POST /skills/install 拒絕非 https URL |
| 單元測試 | POST /skills/install 拒絕含特殊字元的 repo 名稱 |
| 單元測試 | DELETE /skills/:id 拒絕刪除內建 skill |
| 整合測試 | 上傳 SKILL.md 後 GET /api/skills 包含新 skill |
| 整合測試 | 上傳 DESIGN.md 後 GET /api/design-systems 包含新 design system |

---

## Codex 提示詞

```
你是 Open Design 專案的開發者。請根據以下 spec 實作「技能與設計系統 UI 安裝器」功能。

## 任務概述
讓使用者可以從 Open Design 的「匯入」選單安裝外部 skill（git URL）或上傳 SKILL.md / DESIGN.md 檔案。

## 需要修改的檔案

### 1. apps/daemon/src/server.ts
新增以下端點：
- POST /api/skills/install — 從 git URL 安裝 skill
  - 只允許 https:// URL
  - repo 名稱只允許 [a-zA-Z0-9._-]，長度上限 64
  - 安裝到 ~/.claude/skills/<repo-name>/
  - 已存在時執行 git pull，否則 git clone --depth=1
  - 安裝後重新掃描並回傳更新後的 skills 列表
  - git 超時 60 秒
- POST /api/skills/upload — 上傳 SKILL.md
  - 只接受 .md 檔案
  - 解析 frontmatter 取得 skill name
  - 安裝到 ~/.claude/skills/<name>/SKILL.md
- POST /api/design-systems/upload — 上傳 DESIGN.md
  - 安裝到 ~/.open-design/design-systems/<name>/DESIGN.md
- DELETE /api/skills/:id — 移除 skill
  - 只允許刪除 ~/.claude/skills/ 下的目錄（防止刪除內建 skill）

### 2. apps/web/src/components/ChatComposer.tsx
將「技能與設計系統」的 ImportItem 改為可互動的安裝面板：
- 兩個 tab：「Git URL」和「上傳檔案」
- Git URL tab：輸入框 + 安裝按鈕，Enter 也可觸發
- 上傳檔案 tab：隱藏的 file input，按鈕觸發，接受 .md 檔案
- 安裝中顯示 loading 狀態
- 安裝失敗顯示錯誤訊息

新增 Props：onInstallSkillUrl, onUploadSkill, onUploadDesignSystem

### 3. apps/web/src/i18n/locales/en.ts 和 zh-TW.ts
新增安裝器相關的 i18n 鍵值（見 spec）。

### 4. packages/contracts/src/index.ts
新增 InstallSkillRequest 和 InstallSkillResponse 型別。

## 注意事項
- git clone 使用 child_process.spawn，不要用 execFile（需要 streaming 輸出）
- 安裝目錄 ~/.claude/skills/ 需要 mkdir -p 確保存在
- 上傳的 .md 檔案用 parseFrontmatter() 解析（已在 frontmatter.ts 中）
- 安裝成功後需要觸發前端重新載入 skills 列表（呼叫現有的 GET /api/skills）

## 驗收條件
1. POST /api/skills/install 拒絕 http:// URL（400）
2. 上傳 SKILL.md 後 GET /api/skills 包含新 skill
3. DELETE /api/skills/built-in-skill 回傳 403
4. 前端安裝面板可以正常顯示和操作
5. pnpm typecheck 通過
6. pnpm test 通過
```
