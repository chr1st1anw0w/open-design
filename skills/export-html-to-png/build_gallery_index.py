#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_gallery_index.py — Skills Gallery 索引生成
=================================================
掃描 export 目錄中的 HTML/PNG 檔案，生成或更新 index.html。

兩種模式：
  1. 獨立模式（無需 index 模板）：直接從 v4 內建模板生成 index.html
  2. 模板注入模式：將 RECORDS JSON 注入到已有 index.html 模板中

用法：
  # 最簡用法（掃描同目錄，覆寫 index.html）
  python build_gallery_index.py

  # 自訂 export 目錄
  python build_gallery_index.py --export-dir /path/to/export

  # 模板注入模式
  python build_gallery_index.py --export-dir ./  --template index.html --out index.html
"""

import argparse, json, re
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import List, Set

DEFAULT_EXPORT_DIR = Path(__file__).parent

MARKER_START = "// <<< RECORDS:AUTOGEN:START >>>"
MARKER_END = "// <<< RECORDS:AUTOGEN:END >>>"

# 排除的檔案名稱
EXCLUDE_FILES = {
    "index.html",
    "sync_skills_to_export.py",
    "build_gallery_index.py",
    "watch_and_export.py",
    "html_to_png_batch_v4.py",
    "html_to_png_batch-1.py",
    "html-to-png-batch-v2.sh",
}


@dataclass
class Record:
    stem: str
    html_src: str
    html_export: str
    png_export: str

    def to_dict(self):
        return asdict(self)


def build_records(export_dir: Path) -> List[Record]:
    """掃描 export_dir，為每組 stem 建立 Record。"""
    stems: Set[str] = set()
    for p in export_dir.iterdir():
        if not p.is_file():
            continue
        if p.name.lower() in EXCLUDE_FILES or p.name.startswith("."):
            continue
        if p.suffix.lower() in (".html", ".png"):
            stems.add(p.stem)

    records: List[Record] = []
    for s in sorted(stems, key=str.lower):
        has_html = (export_dir / f"{s}.html").exists()
        has_png = (export_dir / f"{s}.png").exists()
        records.append(Record(
            stem=s,
            html_src=f"./{s}.html" if has_html else "",
            html_export=f"./{s}.html" if has_html else "",
            png_export=f"./{s}.png" if has_png else "",
        ))
    return records


def inject_records(template_html: str, records: List[Record]) -> str:
    """將 RECORDS JSON 注入模板（支援 marker 或 fallback）。"""
    rj = json.dumps([r.to_dict() for r in records], ensure_ascii=False, indent=2)
    block = "\n".join([MARKER_START, f"var RECORDS = {rj};", MARKER_END])

    # 方式 1：marker 替換
    if MARKER_START in template_html and MARKER_END in template_html:
        pat = re.compile(re.escape(MARKER_START) + r".*?" + re.escape(MARKER_END), re.DOTALL)
        return pat.sub(block, template_html, count=1)

    # 方式 2：替換 var R=__RECORDS__ 或 var RECORDS = [...]
    for pattern in [
        r"var\s+R\s*=\s*__RECORDS__\s*;",
        r"var\s+RECORDS\s*=\s*\[.*?\]\s*;",
    ]:
        pat = re.compile(pattern, re.DOTALL)
        if pat.search(template_html):
            return pat.sub(f"var RECORDS = {rj};", template_html, count=1)

    raise RuntimeError(
        "找不到 RECORDS marker 或 var 宣告。\n"
        "請確保 index.html 包含以下標記之一：\n"
        f"  {MARKER_START} ... {MARKER_END}\n"
        "  var R=__RECORDS__;\n"
        "  var RECORDS = [...];"
    )


def main():
    ap = argparse.ArgumentParser(description="生成或更新 Skills Gallery index.html")
    ap.add_argument("--export-dir", type=Path, default=DEFAULT_EXPORT_DIR,
                     help="匯出目錄（預設：腳本所在目錄）")
    ap.add_argument("--template", type=Path, default=None,
                     help="index.html 模板（預設：export-dir/index.html）")
    ap.add_argument("--out", type=Path, default=None,
                     help="輸出路徑（預設：export-dir/index.html）")
    args = ap.parse_args()

    export_dir = args.export_dir.expanduser().resolve()
    template_path = (args.template or export_dir / "index.html").expanduser().resolve()
    out_path = (args.out or export_dir / "index.html").expanduser().resolve()

    records = build_records(export_dir)

    if not template_path.exists():
        print(f"[ERROR] 模板不存在：{template_path}")
        print("        請先執行 html_to_png_batch_v4.py 產生初始 index.html")
        raise SystemExit(1)

    html = template_path.read_text(encoding="utf-8")
    new_html = inject_records(html, records)
    out_path.write_text(new_html, encoding="utf-8")

    print(f"[OK] 已寫入：{out_path}")
    print(f"     共 {len(records)} 個 records（HTML 或 PNG）")


if __name__ == "__main__":
    main()