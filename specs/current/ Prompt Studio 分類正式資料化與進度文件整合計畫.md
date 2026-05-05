# Prompt Studio 分類正式資料化與進度文件整合計畫（雙軌）

  ## Summary
  - 目標是同步完成「實作規格定義」與「開發進度治理」：在 `specs/current` 新增一份主規格，並更新既有進度/索引/提示詞相關文件，形成單一決策來源 + 多入口追蹤。
  - 實作範圍覆蓋四項任務：分類資料化收斂、單一資料來源與 schema 對齊、UI 移除臨時硬編碼、驗證補齊（`typecheck` + 測試）。
  - 完成標準是：Prompt Studio 僅依賴正式資料層、文件狀態與程式現況一致、可由下一位工程師直接按規格執行。

  ## Implementation Changes
  1. 文件雙軌整合（`specs/current`）
  - 新增主規格：`specs/current/prompt-studio-data-formalization-plan.md`。
  - 內容固定包含：現況盤點、目標架構、資料流、schema 契約、實作任務拆解、驗收標準、測試矩陣、風險與回退。
  - 更新 `specs/current/index.md`：新增主規格索引列，狀態標記為「🔄 進行中」。
  - 更新 `specs/current/DEV-STATUS.md`：新增「Prompt Studio 分類正式資料化」專章，拆為 P0 任務與勾選清單。
  - 更新 `specs/current/gpt-image2-prompt-gallery.md`：加入「與 Prompt Studio 正式資料層對齊」段落，明確切分 Workbench Gallery 與 Prompt Studio Template 資料責任邊界。

  2. 資料化收斂與單一資料來源策略
  - 以 `cases.json + public/garden/.../case/**` 作為唯一內容來源，禁止 UI 端臨時字串或孤立 mapping 充當資料來源。
  - 定義正式 schema（最小必要欄位）：`category`、`template meta`、`case payload`、`content/md_path`、`placeholders`、`preview`、`source attribution`（若適用）。
  - 定義來源優先序與容錯規則：`cases.json` 為索引與快取、`public/garden/.../case/**` 為內容實體；缺漏時記錄可觀測錯誤，不做靜默 fallback 到硬編碼。

  3. Prompt Studio UI 讀取路徑統一
  - 收斂 `PromptStudio` 與 `UiUxPromptStudio` 的資料取得行為，移除 category hardcode 與隱式預設。
  - 將欄位顯示名稱（如參數中文化）改為由正式 metadata 驅動；僅保留通用 fallback（`snake_case -> label`），不再維護散落常量表作為主來源。
  - 統一模板載入流程：優先使用已解析內容，否則走正式 API/資料層載入；模板 key 規則固定為 `category/template`。

  4. 驗證與測試要求
  - 最低必跑：`pnpm typecheck`、`pnpm test`。
  - 補齊資料層測試：schema 驗證、category/template key 合法性、缺欄位失敗行為、來源一致性檢查。
  - 補齊 UI 測試：分類列表渲染、模板切換、參數編輯即時預覽、讀取失敗提示、無硬編碼回退行為。
  - 文件內附「執行命令順序」與「判定通過條件」，作為 PR 驗收清單。

  ## Public APIs / Interfaces / Types
  - 新增或收斂前端共享型別（位於 gpt-image2 data/types 層）：`PromptCategoryMeta`、`PromptTemplateMeta`、`PromptCaseRecord`、`PromptStudioDataSourceManifest`（命名可依現有風格微調，但
    語義固定）。
  - 若現有 `load-template-md` 回傳形狀不足，規格中定義擴充欄位（例如 `key/category/placeholders/contentSource`），並標記為向後相容擴充。
  - 明確規定 UI 元件僅可透過 data adapter 取數，禁止元件內直接拼接臨時資料。

  ## Test Plan
  - 單元測試
  1. `cases.json` 與 `public/garden/.../case/**` 的索引對齊檢查。
  2. template key 解析與 category 對應檢查。
  3. schema 缺欄位/型別錯誤時應拋出可識別錯誤。

  - 整合測試
  1. Prompt Studio 分類 -> 模板 -> workspace 流程完整可走通。
  2. 同一模板在主流程與 UI/UX 專區讀取結果一致。
  3. `load-template-md` 或資料缺失時，UI 顯示錯誤狀態且不使用硬編碼內容。

  - 驗收命令
  1. `pnpm typecheck`
  2. `pnpm test`
  3. （若有對應腳本）資料對齊檢查腳本，例如 `pnpm check:prompt-studio-data`

  ## Assumptions
  - 採「雙軌」：新增主規格，同步更新 `DEV-STATUS/index/gpt-image2-prompt-gallery`。
  - 本階段不新增後端新功能端點，僅對齊既有資料契約與前端讀取策略。
  - 本計畫先聚焦 Prompt Studio 資料治理，不擴充 Thesys C1 對話升級或新 UI feature。
