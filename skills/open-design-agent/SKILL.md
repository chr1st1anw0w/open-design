---
name: open-design-agent
description: Open Design AI agent 路由與工作流技能。當 agent 需要透過 Open Design repository 與其內建 skills 進行設計、建置、審核或打包 artifact，或使用者希望即使不在 Open Design app 內也能為設計任務選擇最適合的 Open Design skill 時使用。
triggers:
  - "open-design agent"
  - "Open Design skill"
  - "use open-design skills"
  - "design workflow"
  - "choose design skill"
  - "設計工作流"
  - "選擇技能"
  - "製作 agent skill"
od:
  mode: meta
  scenario: planning
  preview:
    type: markdown
    entry: README.md
  design_system:
    requires: false
metadata:
  author: Christian Wu
  version: "1.0.0"
  created: "2026-05-08"
---

# Open Design Agent

此技能是 AI agent 使用 Open Design 作為設計生產工具箱時的總入口。它會依照使用者需求，將任務路由到 `/Users/christianwu/open-design/skills` 底下最適合的技能，然後套用該技能自己的 workflow、references、scripts 與 quality gates。

此技能可在 Open Design、Codex、Claude Code、Cursor 或任何相容 CLI 中使用。核心原則是：把 Open Design skills folder 視為 source of truth；執行前先讀取被選中的技能；最終 artifact 必須符合該技能定義的 workflow 與輸出形狀。

## Repository Context（儲存庫情境）

- Tool root: `/Users/christianwu/open-design`
- Skill library: `/Users/christianwu/open-design/skills`
- Runtime baseline: Node `~24`, `pnpm@10.33.2`
- Local lifecycle entry: `pnpm tools-dev`
- Web run pattern: `pnpm tools-dev run web --daemon-port <port> --web-port <port>`
- Repo 變更的品質基線：`pnpm typecheck` 與 `pnpm test`；若觸及 build boundary，再加跑 `pnpm build`。

修改 repository 前，先檢查 local status，並與現有變更協作。不得還原使用者既有變更。不得推送到 `origin` 或 `upstream`；只有在使用者明確要求推送時，才可使用 maintainer fork remote。

## Primary Operating Loop（主要操作流程）

1. 判斷使用者要求的 artifact 類型與情境。
2. 從 router 選擇最小且最貼合的 Open Design skill。
3. 讀取該技能的 `SKILL.md`，以及與任務直接相關的 `references/`、`workflows/`、`templates/`、`assets/` 或 `scripts/`。
4. 若被選中的技能提供 templates、scaffolds 或 scripts，優先沿用並最小修改。
5. 使用該技能的 checklist 與 Open Design 一般檢查來驗證 artifact。
6. 回報 artifact paths、已執行的 verification，以及任何已知限制。

與使用者對話時，預設使用繁體中文。若需求不明確，先依 artifact 類型做保守推論；只有在選錯 workflow 會造成大量返工或覆蓋使用者檔案時，才用簡短問題釐清。

## Fast Router（快速路由）

先使用下表。完整選擇規則見 `references/router.md`。

| 使用者意圖 | 預設技能 | 原因 |
|---|---|---|
| 結構化 design spec、`DESIGN.md`、視覺方向 | `design-brief` | 將模糊設計意圖轉成具體 tokens、layout、typography 與 constraints |
| Stitch 的高品質視覺系統 | `taste-design` | 產生嚴格、反通用化的 premium UI generation `DESIGN.md` 指引 |
| Stitch screen generation 或 edit | `stitch-design` | 強化 prompt、使用 Stitch workflows、下載 HTML 與 screenshots |
| 自主迭代 Stitch site | `stitch-loop` | 使用 baton files 與 site roadmap 進行逐頁生產 |
| Stitch design 轉 React implementation | `react-components` | 將 Stitch output 轉成 modular Vite/React components |
| shadcn/ui app 或 component integration | `shadcn-ui` | 處理 component discovery、install、customization 與 component ownership |
| 一般 web UI design 或 review | `web-design` | 套用 production UI fundamentals、accessibility、responsive behavior 與 polish |
| 建立可重用 design language skill | `web design-hue` | 從 brands、screenshots、URLs 或 style prompts 產生 opinionated design language skills |
| HTML presentation、slides、deck、keynote | `html-ppt` | 使用 themes、deck templates、runtime、presenter notes 與 render scripts |
| Replit Slides style deck | `replit-deck` | 提供精準的 Replit-inspired theme systems 與 single-file deck templates |
| HTML 產生的 PPTX 需要 audit 或 repair | `pptx-html-fidelity-audit` | 比對 HTML source 與 PPTX export，修正 fidelity drift |
| HTML video composition、captions、TTS、motion | `hyperframes` | 製作並渲染 HyperFrames HTML video compositions |
| Codex animated pet spritesheet | `hatch-pet` | 負責 pet prompts、8x9 atlas validation、QA、previews 與 packaging |
| Screenshot color extraction | `image-analysis` | 從 screenshots 與 mockups 擷取 dominant palettes |
| Screenshot text extraction | `image-to-text` | 執行 OCR，回傳 text、confidence 與 boxes |
| Visual regression 或 implementation-vs-design diff | `image-compare` | 產生 pixel diff stats 與 diff image |

## Workflow Discipline（工作流紀律）

Open Design skills 是 artifact-shape skills。不得把它們壓平成泛泛建議。每個被選中的技能都可能定義自己的：

- `od.mode`、`od.surface`、`od.preview`、inputs 與 outputs。
- 必要 scripts，例如 deck renderers、OCR、image diff 或 Stitch download helpers。
- 必須保留而不是重寫的 template files。
- Verification gates，例如 visual comparison、keyboard navigation、PPTX shape extraction 或 spritesheet geometry。

若技能包含 `references/` 或 `workflows/`，只讀取當前 artifact 需要的檔案。若技能包含 starter template 或 scaffold，優先編輯該 scaffold，而不是從零重寫等價內容。

## Design Defaults（設計預設）

除非被選中的技能另有規定：

- 使用者以中文溝通時，user-facing UI copy 與回覆優先使用繁體中文。
- Code、identifiers、variables 與 types 保持英文。
- 產生 UI 與文件時避免 emoji，除非使用者明確要求。
- 介面動作優先使用 icons、SVG assets 或既有 icon libraries。
- 避免通用 AI 設計痕跡：過大的 gradients、隨機裝飾 blobs、完全相同的 metric cards、全部置中、弱 hierarchy、缺少 states、不可及的 contrast。
- Web artifacts 必須驗證 mobile 與 desktop 行為。

## Outside Open Design（在 Open Design 外使用）

當此技能在 `/Users/christianwu/open-design` 外執行時，仍應把 Open Design skill library 當作 reference implementation：

1. 解析相關 skill directory：`/Users/christianwu/open-design/skills`。
2. 讀取該技能的 `SKILL.md`。
3. 僅把必要 templates、scripts 與 references 複製或改寫到當前 project。
4. 保留被選中 workflow 的 artifact shape 與 checks。
5. 不假設 Open Design daemon helpers 可用。若 workflow 需要 `OD_PROJECT_DIR`、`OD_BIN` 或 `pnpm tools-dev`，請切換到文件化的 non-OD fallback，或說明缺少 runtime。

## Required References（必要參考文件）

- `references/router.md`：完整 skill selection matrix。
- `references/workflows.md`：end-to-end design、deck、video、image 與 implementation flows。
- `README.md`：使用者可讀的 usage 與 examples。
