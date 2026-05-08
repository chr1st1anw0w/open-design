# Open Design Agent Workflows

這些 workflows 會把 Open Design skills 組成可重複使用的 production paths。

## Workflow 1: 從自然語言 brief 建立設計

適用於使用者提供 idea、product、audience 或 style direction，但尚未有具體 design system 的情境。

1. 讀取 `skills/design-brief/SKILL.md`。
2. 將 natural language 轉換為 structured design dimensions。
3. Generate 或 draft `DESIGN.md`。
4. 若 artifact 需要 premium 或 non-generic 的視覺品質，讀取 `skills/taste-design/SKILL.md`，並收緊 typography、layout、palette 與 anti-pattern constraints。
5. 繼續進入 `web-design`、`stitch-design`、`html-ppt` 或其他 artifact-specific skill。

Outputs（輸出）:

- `DESIGN.md` 或等價 design spec。
- 若 target skill 支援，產出 optional visual preview。
- 對未指定 dimensions 提供清楚 assumptions。

## Workflow 2: Screenshot to UI（截圖轉 UI）

適用於使用者提供 screenshot、design export、mockup 或 reference image 的情境。

1. 執行 `image-analysis` 擷取 palette。
2. 當 visible copy 重要時，執行 `image-to-text`。
3. 若 matching fidelity 重要，保留 reference screenshot 供後續 `image-compare` 使用。
4. 將擷取出的 facts 轉成 `design-brief`。
5. 使用 `web-design`、`stitch-design`、`react-components` 或 `shadcn-ui` 實作。
6. 擷取 implementation screenshot，並用 `image-compare` 與 reference 比對。

Quality gates（品質檢查）:

- Palette roles 必須被命名，不只複製 hex values。
- Text hierarchy 必須重建，而不是只重打文字。
- Mobile layout 必須有意識地設計，而不是把 desktop 硬擠進小螢幕。
- Diff results 要被解讀；小量 anti-aliasing differences 可接受，structural drift 不可接受。

## Workflow 3: Stitch to React

適用於 Stitch 是 visual design source，而 final deliverable 是 React application 或 component 的情境。

1. 使用 `stitch-design` generate 或 edit screen。
2. 將 screen HTML 與 screenshot 下載到 `.stitch/designs`。
3. 使用 `react-components` 建立 typed、modular React components。
4. 將 static content 移到 `src/data/mockData.ts`。
5. 需要 behavior 時，將邏輯移到 `src/hooks/` 下的 hooks。
6. 使用 component validation script 與 project checks 驗證。

Quality gates（品質檢查）:

- UI 有自然 sections 時，不產出單一巨大 component。
- Props 使用 `Readonly` interfaces 型別化。
- Theme values 來自 extracted config 或 design tokens。
- Live result 必須與 Stitch screenshot 做視覺檢查。

## Workflow 4: Production Web Interface（正式 Web 介面）

適用於使用者要求 app、dashboard、landing page、tool UI 或 component system。

1. 當 Radix/Base UI primitives 適合時，透過 `shadcn-ui` 處理 component needs。
2. 使用 `web-design` 檢查 layout、typography、states、responsive behavior、accessibility 與 polish。
3. 優先沿用 repository 既有 components 與 style conventions。
4. Web app 需要時啟動 local dev server。
5. 對重大 visual changes 使用 browser screenshots 驗證。

Quality gates（品質檢查）:

- Desktop 與 mobile 都能正常使用。
- Buttons、inputs、menus、loading、empty、error、disabled、hover、focus 與 active states 都被考慮。
- Buttons、cards、toolbars 或 sidebars 中不得發生 text overflow。
- 不加入削弱 information hierarchy 的裝飾雜訊。

## Workflow 5: HTML Deck or Presentation（HTML 簡報）

適用於使用者要求 PPT、slides、presentation、keynote、pitch deck、technical sharing、report 或 slideshow。

1. 若使用者要求 Replit Slides style，使用 `replit-deck`；否則使用 `html-ppt`。
2. 只選一個 theme system，不混用 tokens。
3. 有 full-deck templates 時優先使用。
4. 當使用者提到 presenting、talk script、presenter mode 或 teleprompter needs 時，加上 speaker notes。
5. 檢查 keyboard navigation 與 slide fit。
6. 若 export to PPTX，export 後執行 `pptx-html-fidelity-audit`。

Quality gates（品質檢查）:

- 每張 slide 都有明確角色。
- Deck 不用空洞頁面硬湊 slide count。
- Text 不與 footer 或 navigation rails 碰撞。
- Presenter notes 是口語提示，不是密集 essay text。

## Workflow 6: HTML Video or Motion Composition（HTML 影片與動態構圖）

適用於 artifact 是 video、animated title card、captioned clip、kinetic typography 或 transition sequence。

1. 讀取 `hyperframes/SKILL.md`。
2. 在 Open Design 內，使用 hidden cache composition workflow。
3. 優先使用 HyperFrames scaffold 快速建立有效 composition。
4. 只依需要編輯 `index.html` 與 timing data。
5. 可用時透過 Open Design daemon dispatch render。
6. 除非使用者明確要求 source files，否則 primary artifact 只回傳 rendered media。

Quality gates（品質檢查）:

- Duration 與 timing 符合 brief。
- Captions 可讀且同步。
- Motion 盡量使用 transform 與 opacity。
- Render 完成，並回報 output path。

## Workflow 7: Pet Spritesheet（寵物 spritesheet）

適用於使用者想要 Codex pet 或 animated mascot。

1. 讀取 `hatch-pet/SKILL.md`。
2. 透過文件化的 image generation path 委派 visual generation。
3. 先 generate 或 record base art。
4. 使用 grounding references 生成 row strips。
5. 使用 bundled scripts 組裝 8x9 atlas。
6. 產出 QA contact sheet、preview video、`spritesheet.png`、`spritesheet.webp` 與 `pet.json`。

Quality gates（品質檢查）:

- Atlas geometry 有效。
- Unused cells 透明。
- Rows 都以同一個 base character grounded。
- 結果在 target cell size 下仍可讀。

## Workflow 8: Create or Improve a Design Skill（建立或改善設計技能）

適用於使用者想建立 reusable design language 或 project-specific agent skill。

1. 使用 `web design-hue` 進行 visual language skill generation。
2. 使用 `skill-creator` conventions 控制 skill structure、progressive disclosure 與 validation。
3. 保持 `SKILL.md` 作為 fast entry point。
4. 將長矩陣、examples 與 checklists 移到 `references/`。
5. 包含 triggers、when-to-use rules 與 artifact outputs。
6. 避免嵌入 secrets、private keys 或 environment-specific credentials。

Quality gates（品質檢查）:

- Skill 有清楚 trigger boundary。
- 它會路由到具體 workflows，而不是泛泛建議。
- Agent 可透過讀取 local references，在原 app 之外套用它。
- Generated files 不覆蓋既有 user-owned skills。
