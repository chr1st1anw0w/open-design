---
description: 透過 Stitch MCP 將文字提示詞生成為全新的設計畫面。 (Generate new screens from a text prompt using Stitch MCP.)
---

# Workflow: Text-to-Design (文字生圖工作流)

Transform a text description into a high-fidelity design screen.
*(// 將文字描述轉化為高擬真設計畫面)*

## Steps (執行步驟)

### 1. Enhance the User Prompt (增強使用者提示詞)
Before calling the Stitch MCP tool, apply the Prompt Enhancement Pipeline. 
*(// 在呼叫 Stitch MCP 工具前，套用提示詞增強管線)*
- Identify the platform (Web/Mobile) and page type. *(// 辨識平台與頁面類型)*
- Incorporate any existing project design system from `.stitch/DESIGN.md`. *(// 整合既有的設計系統規範)*
- *Optional Integration*: Query NotebookLM to fetch custom UI patterns. *(// 選擇性整合：查詢 NotebookLM 獲取自定義 UI 模式)*

### 2. Identify the Project (確認專案 ID)
Use `list_projects` to find the correct `projectId` if it is not already known. 
*(// 若不知道專案ID，呼叫 list_projects 查詢)*

### 3. Generate the Screen (生成畫面)
Call the `generate_screen_from_text` tool with the enhanced prompt. 
*(// 使用增強後的提示詞，呼叫 generate_screen_from_text 工具)*

```json
{
  "projectId": "...",
  "prompt": "[Your Enhanced Prompt] (你增強後的提示詞)",
  "deviceType": "DESKTOP" // or MOBILE
}
```

### 4. Present AI Feedback (呈現 AI 意見回饋)
Always show the text description and suggestions from `outputComponents` to the user.
*(// 將 outputComponents 中的描述與建議展示給使用者看)*

### 5. Download Design Assets (下載設計資產)
After generation, download the HTML and screenshot urls from `outputComponents` to the `.stitch/designs` directory.
*(// 生成後，將 HTML 與截圖下載到 .stitch/designs 目錄)*
- **Naming (命名)**: Use the screen ID or a descriptive slug for the filename.
- **Directory (目錄)**: Ensure `.stitch/designs` exists.

### 6. Review and Refine (審查與微調)
- If the result is not exactly as expected, use the [edit-design](claude-sync/skills/stitch-ui-design/workflows/edit-design.md) workflow to make targeted adjustments. *(// 若結果不符預期，使用 edit-design 工作流進行局部微調)*
- Do NOT re-generate from scratch unless the fundamental layout is wrong. *(// 除非基礎排版錯誤，否則不要從頭重新生成)*