---
title: thesys-c1-elevenlabs-integration-plan
source: notion
page_id: <page_id_13>
---

# thesys-c1-elevenlabs-integration-plan-2

# C1 替換方案 — 實作追蹤

<aside> 📋

本頁用於**實際在 `nexu-io/open-design` 倉庫內進行代碼修改時**的步驟追蹤。主 spec 見父頁 [C1 對話面板替換方案](https://www.notion.so/C1-6ae36cb0bca942d381179178bbd8cc77?pvs=21)。

</aside>

## 0. 前置作業

* [ ]  `git checkout -b feat/c1-chat-panel`
* [ ]  `pnpm install`
* [ ]  確認 daemon 能起：`pnpm dev:all`
* [ ]  在 `apps/web/src` 跑 `rg -l "ChatPanel|MessageList|useChatStream"` 核對實際檔名（跟 spec 預估路徑對齊）

## 1. 依賴安裝

```bash
cd apps/web
pnpm add @thesysai/genui-sdk @crayonai/react-ui
pnpm add -D @types/react
```

* [ ]  `@thesysai/genui-sdk` 安裝成功
* [ ]  `pnpm build` 走編譯確認無 type 衝突

## 2. 檔案骨架創建

### 新增檔案清單

* [ ]  `apps/web/src/lib/feature-flags.ts`
* [ ]  `apps/web/src/lib/c1-bridge/event-mapper.ts`
* [ ]  `apps/web/src/lib/c1-bridge/xml-builder.ts`
* [ ]  `apps/web/src/lib/c1-bridge/sse-parser.ts`
* [ ]  `apps/web/src/lib/c1-bridge/thread-store.ts`
* [ ]  `apps/web/src/app/api/c1/route.ts`
* [ ]  `apps/web/src/app/api/c1/threads/route.ts`
* [ ]  `apps/web/src/app/api/c1/threads/[id]/route.ts`
* [ ]  `apps/web/src/app/api/c1/threads/[id]/messages/route.ts`
* [ ]  `apps/web/src/components/chat-c1/ChatPanelC1.tsx`
* [ ]  `apps/web/src/components/chat-c1/customComponents/index.ts`
* [ ]  `apps/web/src/components/chat-c1/customComponents/CLIBadge.tsx`
* [ ]  `apps/web/src/components/chat-c1/customComponents/SkillPicker.tsx`
* [ ]  `apps/web/src/components/chat-c1/customComponents/TodoWriteCard.tsx`
* [ ]  `apps/web/src/components/chat-c1/customComponents/BashCard.tsx`
* [ ]  `apps/web/src/components/chat-c1/customComponents/FileCard.tsx`
* [ ]  `apps/web/src/components/chat-c1/customComponents/ArtifactChip.tsx`
* [ ]  `apps/web/src/components/chat-c1/customComponents/CritiqueScorecard.tsx`
* [ ]  `apps/web/src/components/chat-c1/customComponents/DiscoveryForm.tsx`
* [ ]  `apps/web/src/components/chat-c1/customComponents/AgentPicker.tsx`
* [ ]  `apps/web/src/components/chat-c1/theme.ts`

### 修改檔案清單

* [ ]  `apps/web/src/components/chat/ChatPanel.tsx` — 改為 feature‑flag dispatcher
* [ ]  `apps/web/src/components/chat/ChatPanelLegacy.tsx` — 原 ChatPanel 重命名
* [ ]  `apps/web/.env.example` — 加入 `NEXT_PUBLIC_CHAT_UI=legacy`
* [ ]  Settings 頁面 — 加入 Chat UI 切換器

## 3. Event Mapper 參考實作

下方程式碼可直接複製至 `apps/web/src/lib/c1-bridge/event-mapper.ts`：

```tsx
/**
 * Map daemon SSE events → C1 Response XML chunks.
 * Daemon event reference: apps/daemon/src/events.ts
 */
export type DaemonEvent =
  | { type: 'assistant.text_delta'; text: string }
  | { type: 'agent.thinking'; text: string }
  | { type: 'tool.todowrite.update'; items: Array<{ id: string; text: string; status: 'pending'|'in_progress'|'done' }> }
  | { type: 'tool.bash.start'; toolId: string; command: string }
  | { type: 'tool.bash.stdout'; toolId: string; chunk: string }
  | { type: 'tool.bash.end'; toolId: string; exitCode: number }
  | { type: 'tool.read'; path: string; bytes: number }
  | { type: 'tool.write'; path: string; diff?: string }
  | { type: 'skill.picked'; skillId: string; skillName: string }
  | { type: 'discovery.questions'; schema: Record<string, unknown> }
  | { type: 'artifact.ready'; artifactId: string; mime: string; url: string; thumbnail?: string }
  | { type: 'critique.scorecard'; scores: Record<string, number>; suggestions: Array<{ dim: string; text: string; fix?: string }> }
  | { type: 'error'; message: string; recoverable?: boolean };

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function mapDaemonEvent(ev: DaemonEvent): string | null {
  switch (ev.type) {
    case 'assistant.text_delta':
      return `<content>${esc(ev.text)}</content>`;

    case 'agent.thinking':
      return `<thinking>${esc(ev.text)}</thinking>`;

    case 'tool.todowrite.update':
      return `<content><Checklist items='${esc(JSON.stringify(ev.items))}' /></content>`;

    case 'tool.bash.start':
      return `<content><Terminal id='${ev.toolId}' command='${esc(ev.command)}' state='running' /></content>`;

    case 'tool.bash.stdout':
      return `<content><TerminalAppend id='${ev.toolId}' chunk='${esc(ev.chunk)}' /></content>`;

    case 'tool.bash.end':
      return `<content><TerminalUpdate id='${ev.toolId}' state='done' exitCode='${ev.exitCode}' /></content>`;

    case 'tool.read':
      return `<content><FileCard op='read' path='${esc(ev.path)}' bytes='${ev.bytes}' /></content>`;

    case 'tool.write':
      return `<content><FileCard op='write' path='${esc(ev.path)}' diff='${esc(ev.diff ?? '')}' /></content>`;

    case 'skill.picked':
      return `<content><SkillBadge id='${ev.skillId}' name='${esc(ev.skillName)}' /></content>`;

    case 'discovery.questions':
      return `<content><DiscoveryForm schema='${esc(JSON.stringify(ev.schema))}' /></content>`;

    case 'artifact.ready':
      return `<artifact id='${ev.artifactId}' mime='${ev.mime}' url='${esc(ev.url)}' thumbnail='${esc(ev.thumbnail ?? '')}' />`;

    case 'critique.scorecard':
      return `<content><CritiqueScorecard scores='${esc(JSON.stringify(ev.scores))}' suggestions='${esc(JSON.stringify(ev.suggestions))}' /></content>`;

    case 'error':
      return `<content><Callout type='error' recoverable='${ev.recoverable ? 1 : 0}'>${esc(ev.message)}</Callout></content>`;

    default:
      return null;
  }
}
```

### 配套 SSE parser

```tsx
// apps/web/src/lib/c1-bridge/sse-parser.ts
export function sseParser(): TransformStream<string, DaemonEvent> {
  let buffer = '';
  return new TransformStream({
    transform(chunk, ctrl) {
      buffer += chunk;
      const lines = buffer.split('\\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        try { ctrl.enqueue(JSON.parse(payload)); } catch { /* skip malformed */ }
      }
    },
  });
}
```

* [ ]  `event-mapper.ts` 實作完成
* [ ]  `sse-parser.ts` 實作完成
* [ ]  `vitest` 單元測試覆蓋所有 event type

## 4. Phase 進度

### Phase A — 骨架 (Day 1–2)

* [ ]  Feature flag 路由可切換（默認 legacy，localStorage override 可開 C1）
* [ ]  Bridge API skeleton 返回哑 SSE（不接 daemon）
* [ ]  C1Chat 能換出「hello」顯示在左側

### Phase B — Bridge 接通 (Day 3–4)

* [ ]  Bridge 接上 daemon `/v1/sessions/:id/stream`
* [ ]  `assistant.text_delta` 能串流到 C1Chat
* [ ]  `agent.thinking` indicator 正確顯示
* [ ]  Cancel （使用者中斷）能正確傳達 daemon SIGTERM

### Phase C — 客製卡片 (Day 5–7)

* [ ]  TodoWriteCard：串流更新 + 勾選回送 daemon
* [ ]  BashCard：可折疊 + stdout 增量追加
* [ ]  FileCard：顯示 path 與 diff
* [ ]  ArtifactChip：點擊 focus 右側 workspace
* [ ]  CritiqueScorecard：五維雷達圖 + suggestion list
* [ ]  DiscoveryForm：submit 回送作為 user message
* [ ]  SkillBadge / CLIBadge

### Phase D — Picker 與互動 (Day 8–9)

* [ ]  AgentPicker (16 CLI) 含偵測狀態
* [ ]  SkillPicker grid 含 71 design system 縮圖
* [ ]  `onAction` handler 覆蓋 5 種 action type

### Phase E — Thread 持久化 (Day 10)

* [ ]  thread CRUD API 實作
* [ ]  `content_type` 雙模式相容測試通過
* [ ]  切換 Legacy/C1 訊息不遺失

### Phase F — 驗證與 rollout (Day 11–11.5)

* [ ]  16 CLI agent 逐一跑測 prompt：`生成一頁 SaaS pricing page`
* [ ]  斷網重連測試
* [ ]  PDF / PPTX / MP4 輸出驗證
* [ ]  Kill switch 模擬：人為造成 5xx 為試
* [ ]  PR 提交 + screenshot demo

## 5. 驗收清單

| 項目       | 驗收標準                                        |
| ---------- | ----------------------------------------------- |
| 視覺一致性 | C1 主願色與 open-design accent‑color 同步       |
| 功能等價   | 7 項舊功能全部可用                              |
| 性能       | SSE 第一個 token 到達 ≤ 800ms（與 legacy 一致） |
| 可逆       | Settings 一鍵切回 legacy，訊息可讀              |
| 包大小     | C1 bundle 增量 ≤ 250KB gzip                     |

## 6. 已明確排除本期範圍

* ❌ `garden/gpt-image2/prompt-expert` 接口對接
* ❌ 移除 legacy ChatPanel（Phase D 之後另案）
* ❌ 雲端 Thesys C1 API 接件（本案全走本地 Bridge）
