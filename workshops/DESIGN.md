# Workshop Deck Design System — zh-TW Design Brief

## 0.2 全域設計變數（Global Design Variables）

- AUDIENCE: 瑄燁團隊 10 人（3 技術 / 2 決策 / 5 商學）
- DURATION: 120 分鐘
- TONE: 專業客觀第三人稱，含 SEO / HOOK 語氣
- LANGUAGE: 繁中為主，技術詞中英對照（例：目標（Objective））
- SLIDE_RATIO: 16:9（1920×1080）
- FONT:
  - 標題：`Noto Sans TC`（Bold, 700）→ fallback `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
  - 內文：`Noto Sans TC`（Regular, 400）→ 同上 fallback
  - 程式碼：`JetBrains Mono`（Regular, 400）→ fallback `ui-monospace, "SF Mono", Menlo, monospace`
  - 限制：不使用襯體字（serif 禁用）

## Visual Theme

- Base theme: `replit-deck/helix`（白底、極簡、圖表友善、accent 節制）
- 風格關鍵字：清爽（Clean）、克制（Restrained）、可讀性優先（Legibility-first）
- Accent 使用規則：每頁最多 1–2 個強調點；不使用大面積藍色填色塊

## Color Tokens（Deck + Charts）

> Deck base tokens 以 `replit-deck/helix` 為準（hex 不替換）。  
> Charts tokens 參考 repo 既有 `skills/index.css` 的 `--chart-*`（oklch），映射為語意角色供圖表/表格使用。

### Base（helix）

- `color.bg`: `#fafafa`
- `color.surface`: `#ffffff`
- `color.fg`: `#19191c`
- `color.muted`: `#6e6e73`
- `color.border`: `#e4e4e7`
- `color.accent`: `#5889fe`
- `color.accentSoft`: `color-mix(in oklch, #5889fe 14%, transparent)`

### Charts（oklch）

- `color.chart.1`: `oklch(0.6539 0.2322 24.3251)`  (warm red/orange)
- `color.chart.2`: `oklch(0.6250 0.2583 305.8714)` (violet)
- `color.chart.3`: `oklch(0.8964 0.1094 204.8017)` (sky)
- `color.chart.4`: `oklch(0.9136 0.1310 177.7414)` (mint)
- `color.chart.5`: `oklch(0.9453 0.1453 102.8937)` (yellow)

### Semantic mapping（建議）

- `chart.primary`: `color.accent`（用於 highlight/單一系列）
- `chart.seriesA..E`: `color.chart.1..5`
- `data.positive`: `color.accent`（僅文字/小標記）
- `data.negative`: `color.chart.1`（僅文字/小標記）
- `data.neutral`: `color.muted`

## Typography Scale

- Display / H1（封面）：`clamp(56px, 8.5vw, 128px)`，`700`
- H2（章節標題）：`clamp(40px, 5vw, 76px)`，`700`
- H3（頁內小標）：`clamp(28px, 3vw, 44px)`，`700`
- Body（內文）：`18px`，`400`，`line-height: 1.5`
- Lead（摘要）：`clamp(16px, 1.2vw, 19px)`，`400`，色彩 `color.muted`
- Mono（meta / code / data labels）：`11–13px`，`400`，`letter-spacing: 0.08–0.12em`

## Spacing

- Slide padding（外框安全邊界）：`clamp(48px, 6vw, 96px)`（vertical） / `clamp(56px, 7vw, 112px)`（horizontal）
- Block gap（同區塊元素間距）：`16–24px`
- Section gap（區塊間距）：`32–64px`（依內容密度調整，避免擠壓）
- Max line length：`56ch`（lead/段落上限）

## Motion

- 允許：水平 scroll-snap + `scroll-behavior: smooth`（deck 既有行為）
- 禁止：額外轉場動畫、parallax、過度 hover 動效（避免干擾閱讀）

## Anti-patterns（禁止事項）

- 禁止襯體字（serif）與任何「看起來像報紙」的字體混入
- 禁止每頁自造配色／每頁覆寫 tokens（theme 必須固定）
- 禁止大面積 accent 填色（accent 只作為文字或細線/小標記）
- 禁止杜撰數字/指標；缺資料就用 `—` 或明確 placeholder
- 禁止漸層濫用、陰影濫用、emoji 裝飾

