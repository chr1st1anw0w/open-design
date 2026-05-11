#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Build Skills Gallery index.html by embedding RECORDS JSON into an existing index.html template.
Modified to remove original_dir and focus on stem-based navigation.
"""

import argparse
import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import List, Dict, Any, Tuple, Set

DEFAULT_SKILLS_ROOT = "/Users/christianwu/open-design/skills"

MARKER_START = "// <<< RECORDS:AUTOGEN:START >>>"
MARKER_END = "// <<< RECORDS:AUTOGEN:END >>>"

@dataclass
class Record:
    stem: str
    html_src: str
    html_export: str
    png_export: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "stem": self.stem,
            "html_src": self.html_src,
            "html_export": self.html_export,
            "png_export": self.png_export,
        }

def parse_stem(stem: str) -> Tuple[str, str]:
    """
    Split stem at the first underscore.
    Example: "web-design-hue_examples_index" -> ("web-design-hue", "examples_index")
    """
    if "_" in stem:
        skill_folder, rest = stem.split("_", 1)
        html_file_stem = rest.strip() or "index"
        return skill_folder.strip(), html_file_stem
    return stem.strip(), "index"

def build_records(export_dir: Path, *, include_index_html: bool = False) -> List[Record]:
    # Collect all unique stems that have either .html or .png
    stems: Set[str] = set()
    for p in export_dir.iterdir():
        if p.is_file() and p.suffix.lower() in [".html", ".png"]:
            if not include_index_html and p.name.lower() == "index.html":
                continue
            # 排除同步指令腳本本身
            if p.name in ["sync_skills_to_export.py", "build_gallery_index.py"]:
                continue
            stems.add(p.stem)

    records: List[Record] = []
    for stem in stems:
        html_export_name = f"{stem}.html"
        png_export_name = f"{stem}.png"
        
        # 檢查檔案是否真的存在
        has_html = (export_dir / html_export_name).exists()
        has_png = (export_dir / png_export_name).exists()
        
        # 使用相對路徑，這對於 Vercel 部署至關重要
        rel_html = f"./{html_export_name}" if has_html else ""
        rel_png = f"./{png_export_name}" if has_png else ""
        
        # 如用戶要求：html_src 與 html_export 保持一致
        records.append(Record(
            stem=stem,
            html_src=rel_html,
            html_export=rel_html,
            png_export=rel_png
        ))

    records.sort(key=lambda r: r.stem.lower())
    return records

def embed_records_into_index(index_html: str, records: List[Record]) -> str:
    records_json = json.dumps([r.to_dict() for r in records], ensure_ascii=False, indent=2)
    block = "\n".join([
        MARKER_START,
        "var RECORDS = " + records_json + ";",
        MARKER_END,
    ])
    
    if MARKER_START in index_html and MARKER_END in index_html:
        pattern = re.compile(
            re.escape(MARKER_START) + r".*?" + re.escape(MARKER_END),
            flags=re.DOTALL,
        )
        return pattern.sub(block, index_html, count=1)
    
    # Permissive fallback
    pattern2 = re.compile(r"var\s+RECORDS\s*=\s*\[.*?\]\s*;", flags=re.DOTALL)
    if pattern2.search(index_html):
        return pattern2.sub("var RECORDS = " + records_json + ";", index_html, count=1)
    
    raise RuntimeError("Cannot find markers or RECORDS assignment in index.html")

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--export-dir", required=True)
    ap.add_argument("--skills-root", default=DEFAULT_SKILLS_ROOT)
    ap.add_argument("--index-template", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--include-index-html", action="store_true")
    args = ap.parse_args()

    export_dir = Path(args.export_dir).expanduser().resolve()
    index_template = Path(args.index_template).expanduser().resolve()
    out_path = Path(args.out).expanduser().resolve()

    records = build_records(export_dir, include_index_html=args.include_index_html)
    
    html = index_template.read_text(encoding="utf-8")
    new_html = embed_records_into_index(html, records)
    out_path.write_text(new_html, encoding="utf-8")
    
    print(f"[OK] Wrote: {out_path}")
    print(f"     Records (Html or Png): {len(records)}")

if __name__ == "__main__":
    main()