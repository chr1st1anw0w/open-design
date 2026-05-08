# Open Design Agent Skill

`open-design-agent` 是用來選擇與執行 Open Design workflow 的 meta-skill。它適合給需要透過 `/Users/christianwu/open-design/skills` 進行設計、實作、審核或打包 artifact 的 AI agent 使用。

## Use Cases（使用情境）

- 為設計需求選擇最適合的 Open Design skill。
- 從 screenshot、brief、Stitch project、HTML deck、video idea 或 React implementation task 建立設計工作流。
- 在不啟動 Open Design app 的情況下，從其他 AI tool 或 repository 使用 Open Design skills。
- 讓工作維持符合 project conventions：繁體中文 UI copy、Node 24、`pnpm tools-dev` 與 skill-specific verification。

## Basic Flow（基本流程）

1. 判斷 artifact 類型：web UI、design system、Stitch screen、React component、deck、video、screenshot analysis、visual diff 或 pet spritesheet。
2. 路由到最小且最貼合的 skill。
3. 讀取該 skill 的 `SKILL.md` 與相關 references。
4. 優先使用 bundled templates 與 scripts，不重造已有工具。
5. 當涉及 code changes 時，同時使用被選中 skill 的 checklist 與 Open Design repo checks 驗證。

## Examples（範例）

```text
User: 幫我用這張截圖做出相同風格的 landing page
Route: image-analysis -> image-to-text -> design-brief or web-design -> web implementation
```

```text
User: 把 Stitch 畫面轉成 React component
Route: react-components
```

```text
User: 做一份 Replit Slides 風格 pitch deck
Route: replit-deck
```

```text
User: 這份 HTML 匯出的 PPTX 跑版，幫我修
Route: pptx-html-fidelity-audit
```

## Important Paths（重要路徑）

- Tool root: `/Users/christianwu/open-design`
- Skills: `/Users/christianwu/open-design/skills`
- 此技能: `/Users/christianwu/open-design/skills/open-design-agent`
- Router reference: `references/router.md`
- Workflow reference: `references/workflows.md`

## Safety Rules（安全規則）

- 修改前先讀取 local status。
- 不覆蓋既有 skill folders。
- 不暴露或複製 config、prompts 或 environment files 中的 secrets。
- 不推送到 upstream remotes。
- 在 Open Design 外執行時，把 daemon-specific helpers 視為 optional；若不可用，改用 portable alternatives。
