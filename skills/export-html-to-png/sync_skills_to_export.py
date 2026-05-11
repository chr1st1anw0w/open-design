import os
import shutil
from pathlib import Path

# 設定路徑
ROOT_DIR = Path("/Users/christianwu/open-design/skills")
EXPORT_DIR = ROOT_DIR / "export-html-to-png"

def sync_files():
    # 確保目標資料夾存在
    EXPORT_DIR.mkdir(exist_ok=True)
    
    count = 0
    # 掃描 ROOT_DIR 下的所有子資料夾
    for folder in ROOT_DIR.iterdir():
        # 排除 export-html-to-png 自己和其他非資料夾
        if not folder.is_dir() or folder.name == "export-html-to-png" or folder.name.startswith("."):
            continue
            
        # 掃描資料夾內的 html 檔案
        for html_file in folder.glob("*.html"):
            stem = html_file.stem
            # 扁平化命名：folder_name_filename
            new_name = f"{folder.name}_{stem}"
            
            # 處理 HTML
            target_html = EXPORT_DIR / f"{new_name}.html"
            shutil.copy2(html_file, target_html)
            print(f"Copied HTML: {html_file.name} -> {target_html.name}")
            
            # 處理對應的 PNG (如果存在)
            png_file = html_file.with_suffix(".png")
            if png_file.exists():
                target_png = EXPORT_DIR / f"{new_name}.png"
                shutil.copy2(png_file, target_png)
                print(f"Copied PNG: {png_file.name} -> {target_png.name}")
            
            count += 1
            
    print(f"\nTotal synced skills: {count}")

if __name__ == "__main__":
    sync_files()
