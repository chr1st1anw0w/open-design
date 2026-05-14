#!/bin/bash
# translate-html.sh
# 使用方式：bash translate-html.sh

INPUT_DIR="."
OUTPUT_DIR="./zh-tw"
mkdir -p "$OUTPUT_DIR"

PROMPT='你是一位精通繁體中文的技術翻譯專家。請將以下 HTML 檔案的文字內容翻譯為繁體中文，並嚴格遵守以下規則：

翻譯規則：
1. 只翻譯 HTML 中的自然語言文字（頁面可見的段落、標題、說明、按鈕文字）
2. 保留所有 HTML 標籤、屬性、class 名稱、id 名稱原封不動
3. 保留所有 CSS 樣式（<style> 區塊）完全不動
4. 保留所有 JavaScript 代碼（<script> 區塊）完全不動
5. 保留專有名詞原文，例如：PR、API、CSS、Triage、Feature Flag、Design Token、Kanban、TypeScript、Git、Claude、Figma 等技術術語
6. 若術語有通用中文說法，可採「英文（中文）」格式，例如：「Design System（設計系統）」
7. 不要翻譯程式碼範例內的字串或注釋
8. 輸出完整的 HTML，不要截斷，不要加任何說明文字

以下是需要翻譯的 HTML 內容：'

for file in [0-9][0-9]-*.html; do
  if [ -f "$file" ]; then
    echo "⏳ 翻譯中：$file"
    content=$(cat "$file")
    echo "${PROMPT}

${content}" | claude -p > "$OUTPUT_DIR/$file"
    echo "✅ 完成：$OUTPUT_DIR/$file"
    sleep 2  # 避免 rate limit
  fi
done

echo "🎉 全部完成！輸出目錄：$OUTPUT_DIR"