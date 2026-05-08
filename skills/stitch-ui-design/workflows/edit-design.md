---
description: 透過 Stitch MCP 編輯現有的設計畫面。 (Edit an existing design screen using Stitch MCP.)
---

# Workflow: Edit-Design (編輯設計工作流)

Make targeted changes to an already generated design.
*(// 對已生成的設計進行局部、針對性的修改)*

## Steps (執行步驟)

### 1. Identify the Screen (確認畫面 ID)
Use `list_screens` or `get_screen` to find the correct `projectId` and `screenId`.
*(// 呼叫 list_screens 或 get_screen 找出正確的 projectId 與 screenId)*

### 2. Formulate the Edit Prompt (擬定編輯提示詞)
Be specific about the changes you want to make. Do not just say "fix it". 
*(// 具體說明想修改的地方，不要只說「修復它」)*
- **Location (位置)**: "Change the color of the [primary button] in the [hero section]..." *(// "更改 [首屏區塊] 中 [主要按鈕] 的顏色...")*
- **Visuals (視覺)**: "...to a darker blue (#004080) and add a subtle shadow." *(// "...改為深藍色 (#004080) 並加上微小的陰影。")*
- **Structure (結構)**: "Add a secondary button next to the primary one with the text 'Learn More'." *(// "在主要按鈕旁新增一個次要按鈕，文字為 '了解更多'。")*

### 3. Apply the Edit (套用編輯)
Call the `edit_screens` tool.
*(// 呼叫 edit_screens 工具進行修改)*

```json
{
  "projectId": "...",
  "selectedScreenIds": ["..."],
  "prompt": "[Your target edit prompt] (你的目標編輯提示詞)"
}
```

### 4. Present AI Feedback (呈現 AI 意見回饋)
Always show the text description and suggestions from `outputComponents` to the user.
*(// 將 outputComponents 中的描述與建議展示給使用者)*

### 5. Download Design Assets (下載更新後的設計資產)
After editing, download the updated HTML and screenshot urls from `outputComponents` to the `.stitch/designs` directory, overwriting previous versions to ensure the local files reflect the latest edits.
*(// 編輯完成後，下載更新的 HTML 與截圖，覆蓋舊檔確保本地端為最新版本)*

### 6. Verify and Repeat (驗證與重複)
- Check the output screen to see if the changes were applied correctly. *(// 檢查輸出畫面，確認修改是否生效)*
- If more polish is needed, repeat the process with a new specific prompt. *(// 若需進一步打磨，使用新的具體提示詞重複此流程)*