  # Export HTML to PNG — 交接文檔

  **項目路徑**: `/Users/christianwu/open-design/skills/export-html-to-png`

  **GitHub 倉庫**: https://github.com/chr1st1anw0w/open-design
  **分支**: `dev`

  **部署平台**: Vercel
  **狀態**: 開發中，待上傳至遠端

  ---

  ## 1. 項目概述

  `export-html-to-png` 是一個批量 HTML-to-PNG 轉換工具，用途如下：

  - 自動偵測網頁滾動方向（橫向或縱向）
  - 根據方向動態設置截圖尺寸：
    - 橫向：5120×1080 px
    - 縱向：1440×自動高度 px
  - 批量轉換多個 HTML 文件為高品質 PNG 截圖
  - 自動生成索引頁面（gallery index），包含搜尋功能、模態瀏覽器、快捷方式

  **核心引擎**: shot-scraper（Playwright 底層）

  ---

  ## 2. 文件結構與功能

  ### 主要 Python 工具（4 個）

  #### `html_to_png_batch_v4.py`（當前主工具）
  - **用途**: 核心批量轉換引擎（v4 最新版本）
  - **主要函數**:
    - `SCROLL_JS`: 內嵌 JavaScript，用於偵測頁面滾動方向
    - `detect(html_path)`: 執行 `shot-scraper javascript` 命令，返回 `"horizontal"` 或 `"vertical"`
    - `screenshot(html_path, direction)`: 根據方向設置截圖尺寸，呼叫 shot-scraper
    - `stem(path)`: 生成相對路徑作為輸出檔名
    - `gen_index()`: 生成 index.html 庫頁面
  - **INDEX_HTML 模板**（~150 行）:
    - 深色主題，使用 oklch 顏色系統
    - 響應式卡片網格（CSS Grid 搭配 auto-fill，最小 260px）
    - 搜尋功能（實時過濾卡片）
    - 模態瀏覽器（點選卡片預覽）
    - Finder 路徑複製快捷方式（快速定位原始 HTML）
    - 平滑動畫與過渡效果

  #### `html_to_png_batch-1.py`
  - **用途**: 舊版本工具
  - **狀態**: 已被 v4 取代，可考慮歸檔或刪除

  #### `sync_skills_to_export.py`
  - **用途**: 同步 skills 目錄至導出目錄
  - **職責**: 自動將修改後的 skill 文件同步到轉換工作目錄

  #### `watch_and_export.py`
  - **用途**: 文件監視與自動導出
  - **職責**: 持續監控源目錄，觸發自動批量轉換

  #### `build_gallery_index.py`
  - **用途**: 庫索引生成
  - **職責**: 獨立生成或更新 index.html（與 v4 內建的 `gen_index()` 互補）

  ### 輸出文件
  - **PNG 截圖**: 數百個生成的 PNG 文件
  - **index.html**: 可交互的庫頁面
  - **構建日誌**: 轉換過程記錄

  ---

  ## 3. 技術棧

  | 元件 | 技術 |
  |------|------|
  | **截圖引擎** | shot-scraper (Playwright) |
  | **編程語言** | Python 3.8+ |
  | **環境管理** | pip / virtualenv |
  | **版本控制** | Git / GitHub |
  | **部署** | Vercel (CDN + static hosting) |
  | **色彩系統** | oklch 顏色空間 |
  | **前端布局** | CSS Grid, Flexbox |

  ---

  ## 4. 環境設置與依賴

  ### 安裝依賴

  ```bash
  cd /Users/christianwu/open-design/skills/export-html-to-png
  pip install -r requirements.txt
  # 或
  pip install shot-scraper

  常用命令

  # 執行批量轉換（v4）
  python html_to_png_batch_v4.py

  # 監視模式（自動轉換）
  python watch_and_export.py

  # 同步 skills
  python sync_skills_to_export.py

  # 生成索引
  python build_gallery_index.py

  ---
  5. Vercel 部署配置

  前置準備

  1. 在 GitHub 上建立 repo（如未完成）：
  git init
  git add .
  git commit -m "initial: export-html-to-png tool"
  git branch -M main
  git remote add origin https://github.com/chr1st1anw0w/open-design.git
  git push -u origin dev
  2. 連接 Vercel：
    - 登入 https://vercel.com
    - 點擊「New Project」
    - 選擇 GitHub repo：open-design
    - 選擇分支：dev

  構建配置

  在 Vercel 專案設定中，設定以下值：

  ┌──────────────────┬────────────────────────────────────────────────────────┐
  │      設定項      │                           值                           │
  ├──────────────────┼────────────────────────────────────────────────────────┤
  │ Framework Preset │ Other                                                  │
  ├──────────────────┼────────────────────────────────────────────────────────┤
  │ Build Command    │ python build_gallery_index.py && echo "Build complete" │
  ├──────────────────┼────────────────────────────────────────────────────────┤
  │ Output Directory │ ./ （或指定輸出目錄）                                  │
  ├──────────────────┼────────────────────────────────────────────────────────┤
  │ Install Command  │ pip install -r requirements.txt                        │
  └──────────────────┴────────────────────────────────────────────────────────┘

  環境變數

  如需動態配置，可在 Vercel 設定以下環境變數：

  SCROLL_TIMEOUT=30000
  SCREENSHOT_WIDTH=5120
  SCREENSHOT_HEIGHT=1080
  INDEX_GENERATE=true

  自動部署觸發

  - 每次 dev 分支 push 後自動觸發 Vercel 部署
  - 構建成功後自動發佈 PNG 文件與 index.html

  ---
  6. Jules 可用的 MCP 提示詞

  提示詞 1：批量截圖

  執行 export-html-to-png 批量轉換：
  - 輸入 HTML 目錄：[PATH]
  - 自動偵測滾動方向
  - 生成 PNG 與索引頁面
  - 上傳至 Vercel

  提示詞 2：監視模式啟動

  啟動文件監視，自動轉換新增或修改的 HTML：
  - 命令：python watch_and_export.py
  - 持續監控源目錄
  - 觸發時自動截圖

  提示詞 3：同步 Skills

  同步 open-design skills 至轉換工作目錄：
  - 命令：python sync_skills_to_export.py
  - 確保最新的 skill 文件被轉換

  提示詞 4：生成索引

  重新生成庫索引頁面：
  - 命令：python build_gallery_index.py
  - 更新搜尋、模態瀏覽器、快捷方式

  提示詞 5：推送至 GitHub + Vercel

  將本地更改推送至 GitHub dev 分支，觸發 Vercel 自動部署：
  git add .
  git commit -m "feat: [描述更改]"
  git push origin dev
  # Vercel 自動部署開始

  ---
  7. 快速開始（Jules 使用指南）

  場景 1：首次設置

  # 1. 複製倉庫
  git clone https://github.com/chr1st1anw0w/open-design.git
  cd open-design/skills/export-html-to-png

  # 2. 安裝依賴
  pip install -r requirements.txt

  # 3. 運行批量轉換
  python html_to_png_batch_v4.py

  # 4. 檢查輸出
  # PNG 文件和 index.html 應在當前目錄

  場景 2：持續監視

  # 啟動監視模式
  python watch_and_export.py

  # 編輯或新增 HTML 文件時，自動觸發轉換
  # Ctrl+C 停止監視

  場景 3：部署到 Vercel

  # 推送至 GitHub
  git push origin dev

  # Vercel 自動部署
  # 檢查 Vercel dashboard 以確認構建完成

  ---
  8. 常見問題與故障排除

  Q: shot-scraper 命令未找到？

  A: 確保 pip install shot-scraper 已執行，或激活正確的 virtualenv。

  Q: SCROLL_JS 為何返回錯誤的方向？

  A: 確認網頁完全加載，可增加 SCROLL_TIMEOUT 環境變數值。

  Q: index.html 搜尋功能不工作？

  A: 檢查 INDEX_HTML 模板中的 JavaScript，確保 DOM 元素 ID 匹配。

  Q: Vercel 部署失敗？

  A: 檢查 Vercel logs，確認 requirements.txt 包含所有依賴，Build Command 正確。

  Q: 如何跳過某些 HTML 文件？

  A: 編輯 html_to_png_batch_v4.py 中的文件篩選邏輯，或手動移除不需要轉換的檔案。

  ---
  9. 下一步行動清單

  - 確認本地測試成功（運行 python html_to_png_batch_v4.py）
  - 將代碼推送至 GitHub dev 分支
  - 在 Vercel 連接倉庫並設定環境變數
  - 測試 Vercel 自動部署
  - 檢查輸出 index.html 和 PNG 文件
  - 文檔化任何自訂配置或擴展

  ---
  10. 聯絡與支援

  - 專案所有人: christian
  - GitHub Issues: https://github.com/chr1st1anw0w/open-design/issues
  - 部署平台: Vercel Dashboard

  ---
  文檔版本: v1.0
  最後更新: 2026-05-11
  狀態: 待發佈

  ---