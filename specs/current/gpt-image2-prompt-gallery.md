# GPT Image 2：Prompt Templates 圖片庫整合

**日期**：2026-05-05  
**狀態**：📋 規劃中，等待確認後執行  
**優先**：P1（Garden 工具增強）  
**預估工作量**：1–2 天

---

## 背景

`/Users/christianwu/open-design/prompt-templates/` 目錄下有 94 個 JSON 格式的社群提示詞（image: 44 個、video: 50 個），格式為 CC-BY-4.0，來源為 YouMind-OpenLab 開源項目。這些提示詞目前未整合進任何 UI，僅存於檔案系統。

目標：將 `image/` 子目錄的 44 個模板整合至 Workbench 頁面，新增「圖片提示詞資料庫」瀏覽功能。

---

## 兩種資料格式對比

| 屬性        | `cases.json` 現有模板          | `prompt-templates/image/*.json` |
| ----------- | ------------------------------ | ------------------------------- |
| Prompt 類型 | Markdown + `{argument}` 佔位符 | 完整字串，可直接使用            |
| 預覽圖      | 無                             | 有 `previewImageUrl`            |
| 來源        | 自製                           | CC-BY-4.0 社群整理              |
| 數量        | 83 個模板                      | 44 個圖片 + 50 個影片           |
| 交互方式    | 填參數後渲染                   | 直接複製或傳送                  |

---

## 整合架構

```
Workbench 側邊欄
├── [現有] UI/UX 介面設計      ← cases.templates (ui-mockups 類)
├── [現有] 其他知識模板         ← cases.templates (其他類)
└── [新增] 圖片提示詞資料庫      ← prompt-templates/image/*.json
       按 category 分組
       （Profile/Avatar、Social Media、Game、Illustration...）
```

---

## Phase A：資料橋接層

### A1 — 建置腳本 `scripts/build-prompt-gallery.ts`

- 讀取 `prompt-templates/image/*.json`（44 個檔案）
- 收集所有唯一 `category`，建立 category 索引
- 輸出 `apps/web/src/garden/gpt-image2/data/prompt-gallery.json`
- 加入 `package.json` 腳本：`"build:gallery": "tsx scripts/build-prompt-gallery.ts"`

### A2 — 型別定義

新增至 `apps/web/src/garden/gpt-image2/types/index.ts`：

```typescript
export interface PromptGalleryItem {
  id: string;
  title: string;
  summary: string;
  category: string;
  tags: string[];
  model: string;
  aspect: string;
  prompt: string;
  previewImageUrl?: string;
  source: {
    repo: string;
    license: string;
    author: string;
    url: string;
  };
}

export interface PromptGallery {
  generated_at: string;
  total: number;
  categories: string[];
  items: PromptGalleryItem[];
}
```

### A3 — data.ts 新增 export

```typescript
import galleryJson from "../data/prompt-gallery.json";
export const promptGallery = galleryJson as PromptGallery;
```

---

## Phase B：Workbench UI 新增圖片庫

### B1 — 側邊欄新增 section

- 「圖片提示詞資料庫」section，收合/展開支援
- 按 category 分組顯示，點擊進入 Gallery 模式

### B2 — 模式狀態切換

```typescript
const [mode, setMode] = useState<"template" | "gallery">("template");
const [selectedGalleryItem, setSelectedGalleryItem] =
  useState<PromptGalleryItem | null>(null);
```

### B3 — Gallery 模式主內容區

選取後顯示：

```
[預覽縮圖（若有 previewImageUrl）]
[標題 + category tag + author + license badge]
[提示詞全文（pre 標籤，可捲動，含複製按鈕）]
[動作按鈕] 複製提示詞 | 傳送到 ChatGPT
```

- 直接使用現有 `handleCopy` 和 `handleSendToChatGPT`
- 不顯示「引數設定」欄（prompt 已完整）

---

## Phase C：建置自動化

### C1 — pnpm 腳本整合

```json
"build:gallery": "tsx scripts/build-prompt-gallery.ts",
"predev": "pnpm build:gallery"
```

### C2 — .gitignore 處理

`prompt-gallery.json` 為自動生成，加入 `.gitignore` 並於 CI 中重新產生。

---

## 變更檔案清單

| 檔案                                                             | 類型     | Phase |
| ---------------------------------------------------------------- | -------- | ----- |
| `scripts/build-prompt-gallery.ts`                                | 新建     | A1    |
| `apps/web/src/garden/gpt-image2/data/prompt-gallery.json`        | 自動生成 | A1    |
| `apps/web/src/garden/gpt-image2/types/index.ts`                  | 修改     | A2    |
| `apps/web/src/garden/gpt-image2/lib/data.ts`                     | 修改     | A3    |
| `apps/web/src/garden/gpt-image2/components/skills/Workbench.tsx` | 修改     | B1-B3 |
| `apps/web/src/garden/gpt-image2/components/skills/Workbench.css` | 修改     | B3    |
| `package.json`（根）                                             | 修改     | C1    |

---

## 驗收標準

1. `pnpm build:gallery` 成功輸出 44 條記錄的 JSON
2. Workbench 側邊欄出現「圖片提示詞資料庫」分組
3. 點擊任一項目，主內容區顯示預覽圖 + 完整提示詞
4. 「複製提示詞」按鈕正常複製
5. 「傳送到 ChatGPT」按鈕觸發生成流程

---

## 備註

- Video 模板（50 個）暫不整合，預留 Phase D 擴展
- `previewImageUrl` 為外部 CDN 連結，不在本地快取
- 來源授權 CC-BY-4.0，顯示 author 連結於 UI 中
