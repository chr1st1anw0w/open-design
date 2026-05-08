# Open Design Skill Router

使用此 router 選擇能完成使用者 artifact 的最小技能。若多個技能都適用，依 pipeline order 執行。

## Design System and Direction（設計系統與方向）

| 情境 | 使用技能 | 下一步讀取 |
|---|---|---|
| 使用者只有模糊風格語言，例如「professional」、「premium」、「clean」、「像 X」 | `design-brief` | `skills/design-brief/SKILL.md` |
| 使用者需要下游 generation 使用的 `DESIGN.md` | `design-brief` | 該技能中的 generated output schema |
| 使用者需要高品質、反通用化的 Stitch direction | `taste-design` | `skills/taste-design/SKILL.md` |
| 使用者想從 brand、URL、screenshot 或 vibe 建立新的 reusable design language skill | `web design-hue` | `skills/web design-hue/SKILL.md` 與符合情境的 template references |

Default pipeline（預設流程）:

```text
brief or screenshot -> design-brief -> optional taste-design -> implementation skill
```

## Stitch and Visual UI Generation（Stitch 與視覺 UI 生成）

| 情境 | 使用技能 | 備註 |
|---|---|---|
| Generate 或 edit Stitch screen | `stitch-design` | 使用它的 workflow router：text-to-design、edit-design、generate-design-md |
| 透過 Stitch 迭代建立 multi-page site | `stitch-loop` | 需要 `.stitch/next-prompt.md`、`.stitch/SITE.md` 與 `.stitch/DESIGN.md` |
| 將 Stitch screen 轉成 React | `react-components` | 先下載 HTML 與 screenshot，再 modularize |

Preferred pipeline（建議流程）:

```text
design-brief or taste-design -> stitch-design -> react-components -> web-design review
```

## Frontend Implementation（前端實作）

| 情境 | 使用技能 | 備註 |
|---|---|---|
| Build 或 review web interface | `web-design` | 用於 layout、hierarchy、responsive behavior、accessibility 與 polish |
| 需要 shadcn/ui components | `shadcn-ui` | 使用 component discovery 與 install commands；components 會被複製進 project |
| 將 Stitch output 轉成 typed React components | `react-components` | 使用該技能的 data layer、hook isolation 與 validation rules |

Implementation gates（實作檢查點）:

- Semantic HTML 與正確 heading order。
- Mobile 與 desktop 的 responsive behavior。
- Keyboard focus 與 visible states。
- 若 local design system 提供 tokens，不硬編碼 design values。
- Repository files 有變更時，執行 project typecheck 與 tests。

## Decks and Presentations（簡報與投影片）

| 情境 | 使用技能 | 備註 |
|---|---|---|
| 一般 HTML PPT、slides、keynote、report、talk 或小紅書圖文 | `html-ppt` | 優先使用 full-deck templates 與 theme/runtime assets |
| 使用者明確要求 Replit Slides style | `replit-deck` | 只選一個 Replit theme；不要混用 theme tokens |
| 需要 presenter mode 或 speaker notes | `html-ppt` | 使用 `presenter-mode-reveal`，並把講稿寫進 `<aside class="notes">` |
| HTML export 出來的 PPTX 視覺跑版 | `pptx-html-fidelity-audit` | Extract PPTX、比對 HTML、修正 export script discipline |

Deck pipeline（簡報流程）:

```text
content outline -> html-ppt or replit-deck -> browser review -> optional PPTX export -> pptx-html-fidelity-audit
```

## Video, Motion, and Media（影片、動態與媒體）

| 情境 | 使用技能 | 備註 |
|---|---|---|
| HTML-based video、kinetic typography、captions、transitions、overlays | `hyperframes` | 在 Open Design 內使用 scaffolded composition 與 daemon render path |
| Animated Codex pet spritesheet | `hatch-pet` | 嚴格遵循 pet prompt、atlas、QA 與 packaging workflow |
| Sprite、short motion 或 pet/video 約束以外的 generated visual asset | 使用更具體的 local skill | 先讀取符合情境的 `SKILL.md` |

## Screenshot and Visual Analysis（截圖與視覺分析）

| 情境 | 使用技能 | 備註 |
|---|---|---|
| 從 screenshot、mockup 或 export 擷取 colors | `image-analysis` | 回傳含 prominence 的 palette JSON |
| 擷取 UI copy 或 text positions | `image-to-text` | 回傳 text、confidence、words、lines、bounding boxes |
| 比對 implementation screenshot 與 design | `image-compare` | 產生 mismatch percentage 與 diff image |

Recommended screenshot pipeline（建議截圖流程）:

```text
image-analysis -> image-to-text -> design-brief -> web-design or stitch-design -> image-compare
```

## Tie-Breaking Rules（選擇衝突時的判斷規則）

1. 優先使用最貼近 artifact 類型的技能。
2. 當 visual direction 不足時，generation 前先使用 `design-brief`。
3. `web-design` 是 review layer，不取代更具體的 generation skill。
4. 除非使用者明確要求 Replit Slides style，否則 deck 預設使用 `html-ppt`。
5. 只有在 HTML/PPTX comparison 或 PPTX repair 是 scope 時，才使用 `pptx-html-fidelity-audit`。
6. 先使用 screenshot tools，再手動抄寫 colors 或 text。
7. 在 Open Design 外執行時，除非 environment exposes required variables，否則避免 daemon-only commands。
