#!/usr/bin/env bash
# html-to-png-batch.sh
# 將 /Users/christianwu/open-design/skills 底下所有 HTML 截圖為同名 PNG
# 自動偵測垂直/水平捲動：垂直 → width=1440 fullpage；水平 → height=1080 fullpage

set -euo pipefail

SKILLS_DIR="/Users/christianwu/open-design/skills"
EXPORT_DIR="/Users/christianwu/open-design/skills/export-html-to-png"

# 建立輸出資料夾
mkdir -p "$EXPORT_DIR"

# 找出所有子資料夾內的 HTML（排除 export 資料夾本身）
find "$SKILLS_DIR" -type f -name "*.html" \
  ! -path "$EXPORT_DIR/*" | while read -r html_file; do

  dir="$(dirname "$html_file")"
  base="$(basename "$html_file" .html)"
  same_dir_png="${dir}/${base}.png"
  export_png="${EXPORT_DIR}/${base}.png"

  echo "▶ 處理：$html_file"

  # 注入檢測腳本，偵測是否為水平捲動
  # 判斷依據：scrollWidth > scrollHeight 且 > clientWidth
  SCROLL_CHECK=$(python3 - <<PYEOF
import subprocess, json, tempfile, os

html_path = "$html_file"
check_script = """
(function() {
  var el = document.documentElement;
  var isHorizontal = el.scrollWidth > el.clientWidth && el.scrollWidth > el.scrollHeight;
  return isHorizontal ? 'horizontal' : 'vertical';
})()
""".strip()

result = subprocess.run(
    ["shot-scraper", "javascript", f"file://{html_path}", check_script],
    capture_output=True, text=True
)
val = result.stdout.strip().strip('"').strip("'")
print(val if val in ("horizontal", "vertical") else "vertical")
PYEOF
)

  echo "   捲動方向：$SCROLL_CHECK"

  if [ "$SCROLL_CHECK" = "horizontal" ]; then
    # 水平捲動：固定高度 1080，全頁寬度展開
    shot-scraper "$html_file" \
      --width 3840 \
      --height 1080 \
      -o "$same_dir_png"
  else
    # 垂直捲動（預設）：固定寬度 1440，全頁高度展開
    shot-scraper "$html_file" \
      --width 1440 \
      --full-page \
      -o "$same_dir_png"
  fi

  # 同時複製到 export 資料夾（若同名衝突加上相對路徑前綴）
  rel_path="${dir#$SKILLS_DIR/}"
  rel_prefix="${rel_path//\//_}_"
  # 若在根目錄則不加前綴
  if [ "$dir" = "$SKILLS_DIR" ]; then
    cp "$same_dir_png" "${EXPORT_DIR}/${base}.png"
  else
    cp "$same_dir_png" "${EXPORT_DIR}/${rel_prefix}${base}.png"
  fi

  echo "   ✅ 輸出：$same_dir_png"
done

echo ""
echo "🎉 完成！所有 PNG 已統一匯出至：$EXPORT_DIR"
