---
description: 分析 Stitch 專案並將其設計系統合成至 .stitch/DESIGN.md 檔案中。 (Analyze a Stitch project and synthesize its design system into a .stitch/DESIGN.md file.)
---

# Workflow: Generate .stitch/DESIGN.md (生成設計規範工作流)

Create a "source of truth" for your project's design language to ensure consistency across all future screens.
*(// 為專案的設計語言建立「唯一真實來源」，確保未來所有畫面風格一致)*

## 📥 Retrieval (資料擷取)

To analyze a Stitch project, you must retrieve metadata and assets using the Stitch MCP tools:
*(// 為了分析專案，你必須使用 Stitch MCP 工具擷取中繼資料與資產)*

1.  **Project lookup (查詢專案)**: Use `list_projects` to find the target `projectId`.
2.  **Screen lookup (查詢畫面)**: Use `list_screens` for that `projectId` to find representative screens (e.g., "Home", "Main Dashboard").
3.  **Metadata fetch (獲取中繼資料)**: Call `get_screen` for the target screen to get `screenshot.downloadUrl` and `htmlCode.downloadUrl`.
4.  **Asset download (下載資產)**: Use HTTP tools or instructions to fetch the HTML code. *(// 使用 HTTP 工具或指令抓取 HTML 原始碼)*

## 🧠 Analysis & Synthesis (分析與合成)

### 1. Identify Identity (識別基本資訊)
- Capture Project Title and Project ID. *(// 記錄專案標題與 ID)*

### 2. Define Atmosphere (定義氛圍)
- Analyze the HTML and screenshot to capture the "vibe" (e.g., "Airy," "Professional," "Vibrant"). *(// 分析 HTML 與截圖來捕捉「氛圍」，例如：輕盈、專業、充滿活力)*

### 3. Map Color Palette (建立色票對照)
- Extract exact hex codes and assign functional roles (e.g., "Primary Action: #2563eb"). *(// 萃取精確的色碼並賦予功能性角色，例如：主要按鈕色)*

### 4. Translate Geometry (轉譯幾何形狀)
- Convert Tailwind/CSS values into descriptive language (e.g., `rounded-full` → "Pill-shaped"). *(// 將 CSS 數值轉為描述性語言，例如將 rounded-full 轉為「膠囊狀」)*

### 5. Document Depth (記錄視覺深度)
- Describe shadow styles and layering (e.g., "Soft, diffused elevation"). *(// 描述陰影與圖層疊加風格)*

## 📝 Output Structure (輸出結構)

Create a `.stitch/DESIGN.md` file in the project directory with this structure:
*(// 在專案目錄建立 .stitch/DESIGN.md 檔案，結構如下：)*

```markdown
# Design System: [Project Title]
**Project ID:** [Insert Project ID Here]

## 1. Visual Theme & Atmosphere (視覺主題與氛圍)
(Description of mood and aesthetic philosophy / 描述情緒與美學理念)

## 2. Color Palette & Roles (色票與角色)
(Descriptive Name + Hex Code + Role / 描述性名稱 + 色碼 + 角色)

## 3. Typography Rules (排版與字體規則)
(Font families, weights, and usage / 字型、粗細與使用情境)

## 4. Component Stylings (組件樣式)
* **Buttons (按鈕):** Shape, color, behavior (形狀、顏色、行為)
* **Containers (容器):** Roundness, elevation (圓角、陰影高度)

## 5. Layout Principles (排版原則)
(Whitespace strategy and grid alignment / 留白策略與網格對齊)
```

## 💡 Best Practices (最佳實踐)
- **Be Precise (保持精確)**: Always include hex codes in parentheses. *(// 括號內務必包含色碼)*
- **Be Descriptive (具描述性)**: Use natural language like "Deep Ocean Blue" instead of just "Blue". *(// 使用如「深海藍」等自然語言，而非單單只寫「藍色」)*
- **Be Functional (具功能性)**: Explain *why* an element is used. *(// 解釋為什麼要使用這個元素)*