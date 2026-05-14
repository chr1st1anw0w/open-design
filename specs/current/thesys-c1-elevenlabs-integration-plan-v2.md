---
title: thesys-c1-elevenlabs-integration-plan-v2
version: 2
supersedes: thesys-c1-elevenlabs-integration-plan 3.md
date: 2026-05-14
status: in-progress
branch: feat/c1-chat-panel
---

# C1 對話面板替換方案 v2 — 鎖定決策版

## 0. 本版相對 v1 的變更

| 項目     | v1                              | v2（本版）                                                                                                                     |
| -------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 整合層級 | 未定                            | **C1Chat 完整替換**（thread/history/composer 全交給 C1）                                                                       |
| 後端路由 | 三選一                          | **Local Bridge**（自建 `/api/c1/*` 把 daemon SSE → C1 Response XML；不接雲端 Thesys）                                          |
| 保留功能 | 7 項                            | **7 項全保留**：CLI agent 切換 / Skill+DS 選擇器 / TodoWrite / Artifact chip / Critique Theater / Thread 歷史 / Discovery Form |
| 上線策略 | 未定                            | **Feature flag 並存**（`NEXT_PUBLIC_CHAT_UI=legacy\|c1` + Settings 一鍵切換 + localStorage override）                          |
| 路徑校準 | `components/chat/ChatPanel.tsx` | 實際 = `components/ChatPane.tsx`（被 `ProjectView.tsx:89` 引用）                                                               |

## 1. 為什麼選「Local Bridge」（給看不懂三條後端路線的你）

簡單講你的需求是：「現在左側 CLI 對話框很文字、很工程師；想換成有卡片、按鈕、圖表、互動的視覺化 UI；但 daemon 還是現在這個本地 daemon，不要連雲」。

對應三條路線的差異：

- **(A) 雲端 Thesys C1 API**：要把對話送到 thesys.dev 雲端讓他們的模型直接吐 C1 XML。優點是渲染最自然；缺點是要 API key、要把對話內容送出機器、跟你現有 16 CLI agent 的本地能力脫鉤。**❌ 排除**
- **(B) Local Bridge（本版採用）**：寫一層薄轉譯層，把 daemon 現有 SSE 事件（text_delta、tool.todowrite、tool.bash、artifact.ready、critique.scorecard …）轉成 C1 認得的 XML chunk，再交給 `<C1Chat>` 渲染。**daemon 不改、CLI agent 不改、不外連**，只是把同一份事件流換個 UI。
- **(C) 純前端組件挑著用**：只引 `@crayonai/react-ui` 的卡片，UI 仍自己寫。缺點是 thread / composer / 取消 / 重試 全部要自己接，等於沒享受到 C1 的價值。

→ 結論：你要的「視覺化、互動、渲染圖形 + 保留所有後端能力」剛好就是 (B)。

## 2. 架構圖（事件流）

```
你輸入 → C1Chat composer
  → POST /api/c1 （Bridge）
    → 轉成 daemon 既有 ChatRunCreateRequest
    → 訂閱 daemon /v1/runs/:id/stream (SSE)
      → event-mapper: DaemonEvent → C1 Response XML chunk
      → 以 SSE 回吐給瀏覽器
  ← C1Chat 解析 XML → 渲染卡片/Markdown/customComponents
```

關鍵：daemon 完全不知道 C1 存在；C1 完全不知道 daemon 存在；中間只有 Bridge 一層。可隨時 kill switch 切回 legacy。

## 3. 檔案清單（校準後）

### 新增（不變）

- `apps/web/src/lib/feature-flags.ts`
- `apps/web/src/lib/c1-bridge/{event-mapper,xml-builder,sse-parser,thread-store}.ts`
- `apps/web/src/app/api/c1/route.ts`
- `apps/web/src/app/api/c1/threads/route.ts`
- `apps/web/src/app/api/c1/threads/[id]/route.ts`
- `apps/web/src/app/api/c1/threads/[id]/messages/route.ts`
- `apps/web/src/components/chat-c1/ChatPaneC1.tsx`
- `apps/web/src/components/chat-c1/customComponents/{index,CLIBadge,SkillPicker,TodoWriteCard,BashCard,FileCard,ArtifactChip,CritiqueScorecard,DiscoveryForm,AgentPicker}.tsx`
- `apps/web/src/components/chat-c1/theme.ts`

### 修改（路徑校準）

- ~~`components/chat/ChatPanel.tsx`~~ → **`components/ChatPane.tsx`**：改為 dispatcher（依 flag 切 Legacy / C1）
- 新增 `components/ChatPaneLegacy.tsx`：原 `ChatPane.tsx` 內容搬過去
- `apps/web/.env.example`：加入 `NEXT_PUBLIC_CHAT_UI=legacy`
- Settings 頁面：加入 Chat UI 切換器（runtime localStorage override）

## 4. Phase 進度（與 v1 同節奏，責任更明確）

### Phase 0 — 前置 ✅ 立即執行

- [x] branch `feat/c1-chat-panel`（已在）
- [ ] `pnpm install @thesysai/genui-sdk @crayonai/react-ui` at `apps/web`
- [ ] `pnpm guard && pnpm --filter @open-design/web typecheck`

### Phase A — 骨架（Day 1–2）✅ 立即執行

- [ ] `feature-flags.ts` + Settings 切換器
- [ ] `ChatPane.tsx` 改 dispatcher，舊內容搬 `ChatPaneLegacy.tsx`
- [ ] `ChatPaneC1.tsx` 載入 `<C1Chat>` 並接 `/api/c1`
- [ ] `/api/c1` 回 dummy SSE：「hello from c1 bridge」
- [ ] 在 dev 環境切到 c1 後，左側顯示 hello

### Phase B — Bridge 接 daemon（Day 3–4）

- [ ] `sse-parser.ts` + `event-mapper.ts` 全 event type 覆蓋
- [ ] `/api/c1` 真正轉發到 daemon `/v1/runs/:id/stream`
- [ ] text_delta / thinking / cancel 串通

### Phase C — 客製卡片（Day 5–7）

- [ ] 7 種 customComponents 全部串通，含 onAction 回送

### Phase D — Picker（Day 8–9）

- [ ] AgentPicker 16 CLI / SkillPicker 71 DS / 5 種 action handler

### Phase E — Thread 持久化（Day 10）

- [ ] thread CRUD、`content_type` legacy/c1 雙模式相容

### Phase F — 驗證 rollout（Day 11–11.5）

- [ ] 16 CLI 逐一跑、PDF/PPTX/MP4 輸出、kill switch、PR

## 5. 驗收清單（同 v1）

| 項目       | 標準                                 |
| ---------- | ------------------------------------ |
| 視覺一致性 | C1 主題色與 open-design accent 同步  |
| 功能等價   | 7 項全可用                           |
| 性能       | SSE 第一個 token ≤ 800ms             |
| 可逆       | Settings 一鍵切回 legacy，舊訊息可讀 |
| 包大小     | C1 bundle 增量 ≤ 250KB gzip          |

## 6. 排除（同 v1）

- ❌ 雲端 Thesys C1 API
- ❌ 移除 legacy（D 之後另案）
- ❌ `garden/gpt-image2/prompt-expert` 對接

## 7. 風險與 kill switch

- `NEXT_PUBLIC_CHAT_UI=legacy` 為 fail-safe 預設
- localStorage `od.chatUi` 個別 override
- Settings 切換器即時生效
- Bridge `/api/c1` 5xx 自動降級 legacy（Phase F 加）
