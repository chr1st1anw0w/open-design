# Open Design / GPT-Image2 配色規則（zh-TW）

## 目標

- 全頁面統一使用語意 token，不直接寫死顏色。
- 預設淺色主題（`theme-paper`），深色為可切換模式。
- 子頁（Gallery / Prompt Studio / Workbench / Skills）保持同一背景層級與對比規則。

## 核心語意 Token

位於：`apps/web/src/garden/gpt-image2/styles/tokens.css`

- 背景層級：
  - `--bg`：頁面背景
  - `--surface`：卡片主底
  - `--surface-2`：次層面板
- 文字層級：
  - `--text`：主文字
  - `--text-mute`：次文字
  - `--text-faint`：提示文字
  - `--inverse-text`：深底上的反白字
- 邊框：
  - `--line`：一般分隔線
  - `--line-strong`：重點分隔線
- 狀態色：
  - `--vermilion`：品牌主強調
  - `--accent-ui`：功能性 UI 強調
  - `--accent-success` / `--accent-success-strong`：成功/確認動作
  - `--accent-warning`：警示狀態
- 遮罩：
  - `--overlay-soft`：輕遮罩（縮圖提示）
  - `--overlay-strong`：重遮罩（Lightbox/Modal）

## 實作規範

1. 禁止在元件 CSS 直接寫 `#00b87e`、`#f59e0b` 等固定狀態色。  
2. 禁止在頁面內用硬編碼黑底覆蓋 `theme-paper`。  
3. 互動按鈕顏色優先規則：
   - 主操作：`--vermilion` 或 `--accent-success`
   - 次操作：`--surface` + `--line-strong`
4. 所有彈層（drawer/modal/lightbox）必須使用 overlay token。  
5. 文字對比：
   - 淺底卡片：`--text` / `--text-mute`
   - 深底卡片：`--inverse-text` / `--text-mute`（必要時再加強）

## 驗收檢查

1. `theme-paper` 下不可出現不可讀黑底黑字區塊。  
2. `dark` / `light` 切換後，按鈕與標題對比皆達到可讀。  
3. Gallery / Prompt Studio / Workbench / Skills 四頁背景層級一致。  
4. 新頁面合併前需掃描硬編碼色（`#` / `rgba`）並評估是否可改 token。
