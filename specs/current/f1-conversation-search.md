# F1 — 多輪對話歷史搜尋

**狀態：** 待開發（等待 Codex）  
**優先：** P0  
**預估工作量：** 3–5 天  
**影響範圍：** `apps/daemon/src/db.ts` · `apps/daemon/src/server.ts` · `apps/web/src/components/ChatPane.tsx`

---

## 問題陳述

使用者在同一個專案累積數十輪對話後，無法快速找到：
- 之前某個 prompt 的內容
- 某個 artifact 是在哪一輪產生的
- Agent 說過的某段設計建議

目前 `db.ts` 的 `messages` 表有完整的對話記錄，但沒有搜尋端點，前端也沒有搜尋 UI。

---

## 目標

1. 使用者可以在專案內搜尋所有對話訊息（user + assistant）
2. 搜尋結果顯示訊息摘要 + 所屬對話標題 + 時間
3. 點擊結果可以跳轉到該對話並高亮該訊息
4. 搜尋速度 < 200ms（SQLite FTS5 本地搜尋）

---

## 技術設計

### 後端：SQLite FTS5 虛擬表

**`apps/daemon/src/db.ts`** — 新增 FTS5 虛擬表和搜尋函式：

```sql
-- 在 migrate() 中新增
CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts
  USING fts5(
    content,
    content='messages',
    content_rowid='rowid',
    tokenize='unicode61'
  );

-- 觸發器：保持 FTS 索引同步
CREATE TRIGGER IF NOT EXISTS messages_fts_insert
  AFTER INSERT ON messages BEGIN
    INSERT INTO messages_fts(rowid, content) VALUES (new.rowid, new.content);
  END;

CREATE TRIGGER IF NOT EXISTS messages_fts_update
  AFTER UPDATE ON messages BEGIN
    INSERT INTO messages_fts(messages_fts, rowid, content)
      VALUES ('delete', old.rowid, old.content);
    INSERT INTO messages_fts(rowid, content) VALUES (new.rowid, new.content);
  END;

CREATE TRIGGER IF NOT EXISTS messages_fts_delete
  AFTER DELETE ON messages BEGIN
    INSERT INTO messages_fts(messages_fts, rowid, content)
      VALUES ('delete', old.rowid, old.content);
  END;
```

**新增搜尋函式：**

```typescript
export function searchMessages(
  db: Database,
  projectId: string,
  query: string,
  limit = 20,
): SearchResult[] {
  // 清理查詢字串，防止 FTS5 語法錯誤
  const safeQuery = query.replace(/['"*()]/g, ' ').trim();
  if (!safeQuery) return [];

  return db.prepare(`
    SELECT
      m.id,
      m.role,
      snippet(messages_fts, 0, '<mark>', '</mark>', '…', 32) AS snippet,
      m.created_at AS createdAt,
      c.id AS conversationId,
      c.title AS conversationTitle,
      c.project_id AS projectId
    FROM messages_fts
    JOIN messages m ON m.rowid = messages_fts.rowid
    JOIN conversations c ON c.id = m.conversation_id
    WHERE messages_fts MATCH ?
      AND c.project_id = ?
    ORDER BY rank
    LIMIT ?
  `).all(`${safeQuery}*`, projectId, limit) as SearchResult[];
}
```

### 後端：新增 API 端點

**`apps/daemon/src/server.ts`** — 新增路由：

```typescript
// GET /api/projects/:id/search?q=<query>&limit=<n>
app.get('/api/projects/:id/search', (req, res) => {
  const { q, limit } = req.query;
  if (!q || typeof q !== 'string' || q.trim().length < 2) {
    return res.json({ results: [] });
  }
  const n = Math.min(Number(limit) || 20, 50);
  try {
    const results = searchMessages(db, req.params.id, q.trim(), n);
    res.json({ results });
  } catch (err) {
    sendApiError(res, 500, 'INTERNAL_ERROR', String(err));
  }
});
```

### 前端：搜尋 UI

**`apps/web/src/components/ChatPane.tsx`** — 在對話列表頂部加入搜尋框：

```tsx
// 搜尋框狀態
const [searchQuery, setSearchQuery] = useState('');
const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
const [isSearching, setIsSearching] = useState(false);

// debounce 搜尋（300ms）
useEffect(() => {
  if (!searchQuery.trim() || searchQuery.length < 2) {
    setSearchResults([]);
    return;
  }
  const timer = setTimeout(async () => {
    setIsSearching(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/search?q=${encodeURIComponent(searchQuery)}&limit=20`
      );
      const data = await res.json();
      setSearchResults(data.results ?? []);
    } finally {
      setIsSearching(false);
    }
  }, 300);
  return () => clearTimeout(timer);
}, [searchQuery, projectId]);
```

**搜尋結果 UI 元件：**

```tsx
function SearchResultItem({ result, onSelect }: {
  result: SearchResult;
  onSelect: (conversationId: string, messageId: string) => void;
}) {
  return (
    <button
      className="search-result-item"
      onClick={() => onSelect(result.conversationId, result.id)}
    >
      <span className="search-result-role">
        {result.role === 'user' ? '你' : 'Agent'}
      </span>
      <span
        className="search-result-snippet"
        dangerouslySetInnerHTML={{ __html: result.snippet }}
      />
      <span className="search-result-meta">
        {result.conversationTitle ?? '未命名對話'} · {formatRelativeTime(result.createdAt)}
      </span>
    </button>
  );
}
```

### i18n 新增鍵值

**`apps/web/src/i18n/locales/en.ts`：**

```typescript
'chat.searchPlaceholder': 'Search conversations…',
'chat.searchNoResults': 'No results for "{query}"',
'chat.searchResultRole.user': 'You',
'chat.searchResultRole.assistant': 'Agent',
```

**`apps/web/src/i18n/locales/zh-TW.ts`：**

```typescript
'chat.searchPlaceholder': '搜尋對話…',
'chat.searchNoResults': '找不到「{query}」的結果',
'chat.searchResultRole.user': '你',
'chat.searchResultRole.assistant': 'Agent',
```

---

## 資料型別（`packages/contracts`）

```typescript
// 新增到 packages/contracts/src/index.ts
export interface MessageSearchResult {
  id: string;
  role: 'user' | 'assistant';
  snippet: string;          // FTS5 snippet，含 <mark> 高亮
  createdAt: number;
  conversationId: string;
  conversationTitle: string | null;
  projectId: string;
}

export interface SearchMessagesResponse {
  results: MessageSearchResult[];
}
```

---

## 現有資料的 FTS 索引重建

對於已有資料的 SQLite 資料庫，需要在 `migrate()` 中加入一次性重建：

```sql
-- 只在 FTS 表剛建立時執行（rowcount = 0）
INSERT INTO messages_fts(rowid, content)
  SELECT rowid, content FROM messages
  WHERE content IS NOT NULL AND content != '';
```

---

## 測試計畫

| 測試類型 | 測試案例 |
|---|---|
| 單元測試 | `searchMessages()` 回傳正確結果 |
| 單元測試 | 特殊字元（`"`, `*`, `(`）不造成 SQL 錯誤 |
| 單元測試 | 空查詢回傳空陣列 |
| 整合測試 | 新增訊息後可立即搜尋到 |
| 整合測試 | 刪除對話後搜尋結果不包含已刪除訊息 |
| E2E | 搜尋框輸入 → 結果出現 → 點擊跳轉 |

---

## Codex 提示詞

```
你是 Open Design 專案的開發者。請根據以下 spec 實作「多輪對話歷史搜尋」功能。

## 任務概述
在 open-design 專案中實作對話搜尋功能，讓使用者可以在專案內搜尋所有對話訊息。

## 需要修改的檔案

### 1. apps/daemon/src/db.ts
在 migrate() 函式中新增 SQLite FTS5 虛擬表和三個觸發器（insert/update/delete）。
新增 searchMessages(db, projectId, query, limit) 函式，使用 FTS5 MATCH 查詢，
JOIN messages 和 conversations 表，回傳含 snippet 的結果陣列。
注意：查詢字串需要清理特殊字元（"'*(）防止 FTS5 語法錯誤。

### 2. apps/daemon/src/server.ts
新增路由 GET /api/projects/:id/search?q=<query>&limit=<n>。
q 長度 < 2 時回傳空陣列。limit 上限 50。
呼叫 searchMessages() 並回傳 { results: [...] }。

### 3. packages/contracts/src/index.ts（或對應的 contracts 檔案）
新增 MessageSearchResult 和 SearchMessagesResponse 型別。

### 4. apps/web/src/components/ChatPane.tsx
在對話列表頂部加入搜尋輸入框。
使用 300ms debounce 呼叫 /api/projects/:id/search。
搜尋結果顯示在對話列表上方，每筆結果顯示：角色、snippet（含 <mark> 高亮）、對話標題、時間。
點擊結果切換到對應對話並滾動到該訊息（用 data-message-id 屬性定位）。
搜尋框清空時恢復正常對話列表。

### 5. apps/web/src/i18n/locales/en.ts 和 zh-TW.ts
新增搜尋相關的 i18n 鍵值（見 spec）。

## 注意事項
- 現有資料庫需要在 migrate() 中一次性重建 FTS 索引
- snippet() 函式的 HTML 輸出需要用 dangerouslySetInnerHTML 渲染，但 snippet 內容來自資料庫，不是使用者輸入，安全性可接受
- 搜尋 UI 的樣式沿用現有的 .composer-import-menu 風格
- 不要修改現有的 listMessages() 或 upsertMessage() 函式簽名

## 驗收條件
1. GET /api/projects/:id/search?q=hello 回傳含 snippet 的結果
2. 輸入特殊字元不造成 500 錯誤
3. 點擊搜尋結果可以跳轉到對應對話
4. pnpm typecheck 通過
5. pnpm test 通過
```
