#!/usr/bin/env python3
"""
Auto HTML → PNG Export Watch System
監控 skills/ 目錄中新增的 HTML，自動複製並截圖。
使用 processed_manifest.json 追蹤已處理檔案，避免重複處理。
"""

import subprocess
import shutil
import json
import os
import sys
import logging
from pathlib import Path
from typing import Dict, Any

# ========== 設定 ==========
SKILLS_DIR = Path("/Users/christianwu/open-design/skills")
EXPORT_DIR = SKILLS_DIR / "export-html-to-png"
MANIFEST_FILE = EXPORT_DIR / "processed_manifest.json"

# ========== 日誌設定 ==========
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger(__name__)

# ========== 核心函式（複用自 html_to_png_batch_v4.py） ==========

SCROLL_JS = "(function(){var e=document.documentElement,b=document.body;var mw=Math.max(e.scrollWidth,b?b.scrollWidth:0),mh=Math.max(e.scrollHeight,b?b.scrollHeight:0),vw=e.clientWidth;return(mw>vw*1.2&&mw>mh)?'horizontal':'vertical';})()"


def detect(p: Path) -> str:
    """偵測 HTML 是否為水平或垂直排版。"""
    try:
        r = subprocess.run(
            ["shot-scraper", "javascript", str(p.resolve()), SCROLL_JS],
            capture_output=True,
            text=True,
            timeout=30
        )
        v = r.stdout.strip().strip('"').strip("'")
        return v if v in ("horizontal", "vertical") else "vertical"
    except Exception as e:
        logger.warning(f"偵測失敗 {p}: {e}，預設為 vertical")
        return "vertical"


def screenshot(src: Path, dst: Path, direction: str) -> None:
    """使用 shot-scraper 產生 PNG。"""
    dst.parent.mkdir(parents=True, exist_ok=True)
    cmd = ["shot-scraper", str(src.resolve()), "-o", str(dst)]
    if direction == "horizontal":
        cmd += ["--width", "5120", "--height", "1080"]
    else:
        cmd += ["--width", "1440"]
    subprocess.run(cmd, check=True, timeout=120)


def stem(p: Path) -> str:
    """計算相對於 SKILLS_DIR 的 stem（用 _ 連接各層）。"""
    try:
        parts = list(p.relative_to(SKILLS_DIR).parts)
        parts[-1] = parts[-1].replace(".html", "")
        return "_".join(parts)
    except ValueError:
        return p.stem


# ========== Gallery 產生邏輯（複用自 html_to_png_batch_v4.py） ==========

INDEX_HTML = """<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Skills Gallery</title>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0f0f10;--surface:#19191c;--s2:#222226;
  --bd:rgba(255,255,255,0.08);--tx:#e8e8ea;--mt:#888890;
  --ac:#4f98a3;--ah:#6eb8c4;--r:12px;--g:20px;
}
body{background:var(--bg);color:var(--tx);font-family:-apple-system,"Helvetica Neue",sans-serif;min-height:100vh}
header{position:sticky;top:0;z-index:100;background:rgba(15,15,16,.88);backdrop-filter:blur(16px);border-bottom:1px solid var(--bd);padding:14px 24px;display:flex;align-items:center;gap:14px;flex-wrap:wrap}
header h1{font-size:17px;font-weight:600}
.cnt{font-size:12px;color:var(--mt)}
.sw{flex:1;min-width:200px;max-width:340px;position:relative}
.sw svg{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--mt);pointer-events:none}
#q{width:100%;padding:7px 10px 7px 32px;background:var(--s2);border:1px solid var(--bd);border-radius:8px;color:var(--tx);font-size:13px;outline:none}
#q:focus{border-color:var(--ac)}
#grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:var(--g);padding:24px}
.card{background:var(--surface);border:1px solid var(--bd);border-radius:var(--r);overflow:hidden;display:flex;flex-direction:column;transition:transform .18s,box-shadow .18s,border-color .18s}
.card:hover{transform:translateY(-3px);box-shadow:0 12px 32px rgba(0,0,0,.5);border-color:rgba(79,152,163,.4)}
.th{cursor:pointer;position:relative;aspect-ratio:16/9;overflow:hidden;background:var(--s2)}
.th img{width:100%;height:100%;object-fit:cover;object-position:top;transition:transform .3s;display:block}
.card:hover .th img{transform:scale(1.04)}
.badge{position:absolute;bottom:7px;right:7px;background:rgba(0,0,0,.6);backdrop-filter:blur(4px);color:#fff;font-size:10px;padding:2px 7px;border-radius:20px;pointer-events:none}
.np{display:flex;align-items:center;justify-content:center;height:100%;color:var(--mt);font-size:12px}
.cb{padding:12px 14px 14px;display:flex;flex-direction:column;gap:8px;flex:1}
.ct{font-size:12px;font-weight:600;color:var(--tx);word-break:break-word;cursor:pointer}
.ct:hover{color:var(--ah)}
.cs{font-size:10px;color:var(--mt);word-break:break-all;line-height:1.4}
.ca{display:flex;gap:7px;margin-top:auto}
.btn{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:4px;padding:6px 8px;font-size:11px;font-weight:500;border-radius:6px;border:1px solid var(--bd);cursor:pointer;background:var(--s2);color:var(--mt);text-decoration:none;transition:background .15s,color .15s,border-color .15s}
.btn:hover{background:var(--ac);color:#fff;border-color:var(--ac)}
.p{background:var(--ac);color:#fff;border-color:var(--ac)}
.p:hover{background:var(--ah);border-color:var(--ah)}
#empty{display:none;flex-direction:column;align-items:center;padding:80px 20px;color:var(--mt);gap:10px;font-size:14px;text-align:center}
#ov{display:none;position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.88);backdrop-filter:blur(8px);align-items:center;justify-content:center}
#ov.open{display:flex}
#mo{position:relative;width:92vw;height:90vh;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.7);display:flex;flex-direction:column}
#mb{display:flex;align-items:center;gap:8px;padding:9px 14px;background:var(--s2);border-bottom:1px solid var(--bd);flex-shrink:0}
#mt2{flex:1;font-size:12px;color:var(--tx);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#mc{cursor:pointer;background:none;border:none;color:var(--mt);font-size:22px;line-height:1;padding:2px 6px;border-radius:5px}
#mc:hover{background:var(--surface);color:var(--tx)}
#mf{flex:1;border:none;width:100%}
#toast{display:none;position:fixed;bottom:28px;left:50%;transform:translateX(-50%);background:rgba(79,152,163,.95);color:#fff;padding:9px 20px;border-radius:24px;font-size:13px;z-index:999;box-shadow:0 4px 20px rgba(0,0,0,.4);pointer-events:none}
</style>
</head>
<body>
<header>
  <h1>🎨 Skills Gallery</h1>
  <span class="cnt" id="cl"></span>
  <div class="sw">
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
    <input id="q" type="text" placeholder="搜尋 skill 名稱…" autocomplete="off">
  </div>
</header>
<div id="grid"></div>
<div id="empty"><span style="font-size:38px">🔍</span>找不到符合的 Skill</div>
<div id="ov">
  <div id="mo">
    <div id="mb">
      <span id="mt2"></span>
      <a id="mtab" href="#" target="_blank" class="btn p" style="flex:0;white-space:nowrap">↗ 新分頁</a>
      <button id="mc">✕</button>
    </div>
    <iframe id="mf" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"></iframe>
  </div>
</div>
<div id="toast"></div>
<script>
var R=__RECORDS__;
var grid=document.getElementById('grid'),empty=document.getElementById('empty'),cl=document.getElementById('cl');
var ov=document.getElementById('ov'),mf=document.getElementById('mf'),mt2=document.getElementById('mt2'),mtab=document.getElementById('mtab');
function openM(h,t){mf.src=h;mt2.textContent=t;mtab.href=h;ov.classList.add('open');document.body.style.overflow='hidden';}
function closeM(){ov.classList.remove('open');mf.src='about:blank';document.body.style.overflow='';}
document.getElementById('mc').addEventListener('click',closeM);
ov.addEventListener('click',function(e){if(e.target===ov)closeM();});
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeM();});
function toast(m){var t=document.getElementById('toast');t.textContent=m;t.style.display='block';clearTimeout(t._x);t._x=setTimeout(function(){t.style.display='none';},3000);}
function copyPath(d){if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(d).then(function(){toast('📋 路徑已複製！在 Finder 按 ⌘⇧G 貼上跳轉');});}else{prompt('路徑（在 Finder 按 ⌘⇧G 貼上）：',d);}}
function render(list){
  grid.innerHTML='';empty.style.display=list.length?'none':'flex';
  cl.textContent=list.length+' / '+R.length+' skills';
  list.forEach(function(r){
    var has=r.png_export&&r.png_export.length>0;
    var th=has?'<img src="'+r.png_export+'" alt="'+r.stem+'" loading="lazy"><span class="badge">HTML</span>':'<div class="np">🖼️ 截圖未產生</div>';
    var c=document.createElement('div');c.className='card';
    c.innerHTML='<div class="th">'+th+'</div>'
      +'<div class="cb">'
        +'<span class="ct">'+r.stem+'</span>'
        +'<div class="cs">'+r.html_src.replace('/Users/christianwu/open-design/skills/','')+'</div>'
        +'<div class="ca"><button class="btn fb">📁 Finder</button>'
        +'<a class="btn p" href="'+r.html_export+'" target="_blank">↗ 開啟</a></div>'
      +'</div>';
    c.querySelector('.th').addEventListener('click',function(){openM(r.html_export,r.stem);});
    c.querySelector('.ct').addEventListener('click',function(){window.open(r.html_export,'_blank');});
    c.querySelector('.fb').addEventListener('click',function(){copyPath(r.original_dir);});
    grid.appendChild(c);
  });
}
document.getElementById('q').addEventListener('input',function(){
  var q=this.value.trim().toLowerCase();
  render(q?R.filter(function(r){return r.stem.toLowerCase().includes(q)||r.html_src.toLowerCase().includes(q);}):R);
});
render(R);
</script>
</body>
</html>"""


def gen_index(records: list[Dict[str, Any]]) -> None:
    """產生 Gallery index.html。"""
    rj = json.dumps(records, ensure_ascii=False)
    content = INDEX_HTML.replace("__RECORDS__", rj)
    out = EXPORT_DIR / "index.html"
    out.write_text(content, encoding="utf-8")
    logger.info(f"✅ index.html 產生：{out}")


# ========== Manifest 管理 ==========

def load_manifest() -> Dict[str, Dict[str, Any]]:
    """讀取 processed_manifest.json。"""
    if MANIFEST_FILE.exists():
        try:
            return json.loads(MANIFEST_FILE.read_text(encoding="utf-8"))
        except Exception as e:
            logger.warning(f"讀取 manifest 失敗：{e}，重新建立")
            return {}
    return {}


def save_manifest(manifest: Dict[str, Dict[str, Any]]) -> None:
    """原子性寫回 manifest（先寫 .tmp，再 rename）。"""
    tmp_file = MANIFEST_FILE.with_suffix(".json.tmp")
    try:
        tmp_file.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
        tmp_file.replace(MANIFEST_FILE)
    except Exception as e:
        logger.error(f"寫入 manifest 失敗：{e}")
        if tmp_file.exists():
            tmp_file.unlink()
        raise


# ========== 主邏輯 ==========

def main() -> None:
    """掃描、複製、截圖、更新 manifest。"""
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)
    manifest = load_manifest()

    # 掃描 skills/ 下所有 HTML
    html_files = sorted([
        f for f in SKILLS_DIR.rglob("*.html")
        if EXPORT_DIR not in f.parents and f.parent != EXPORT_DIR
    ])

    if not html_files:
        logger.info("⚠️  未找到任何 HTML 檔案")
        return

    logger.info(f"📋 共掃描 {len(html_files)} 個 HTML 檔案")
    processed = 0
    skipped = 0
    failed = 0
    records = []

    for html_file in html_files:
        s = stem(html_file)
        mtime = html_file.stat().st_mtime

        # 檢查是否需要處理
        if s in manifest and manifest[s].get("mtime") == mtime:
            logger.debug(f"⏭️  跳過（已處理）：{s}")
            skipped += 1
            # 重新讀取 record 加回 records（用於 Gallery 更新）
            if "record" in manifest[s]:
                records.append(manifest[s]["record"])
            continue

        logger.info(f"📝 處理：{s}")

        try:
            # 複製 HTML
            html_export_path = EXPORT_DIR / f"{s}.html"
            shutil.copy2(html_file, html_export_path)

            # 截圖
            png_export_path = EXPORT_DIR / f"{s}.png"
            direction = detect(html_export_path)
            logger.debug(f"  方向：{direction}")
            screenshot(html_export_path, png_export_path, direction)

            # 更新 manifest
            record = {
                "stem": s,
                "html_src": str(html_file),
                "html_export": f"{s}.html",
                "png_export": f"{s}.png",
                "original_dir": str(html_file.parent),
            }
            manifest[s] = {
                "mtime": mtime,
                "record": record
            }
            records.append(record)
            processed += 1
            logger.info(f"✅ 完成：{s}")

        except subprocess.CalledProcessError as e:
            logger.error(f"❌ 截圖失敗 {s}：{e}（下次仍會重試）")
            failed += 1
        except Exception as e:
            logger.error(f"❌ 処理失敗 {s}：{e}")
            failed += 1

    # 更新 manifest
    save_manifest(manifest)

    # 更新 Gallery
    if records:
        gen_index(records)

    logger.info(f"\n📊 結果：{processed} 處理、{skipped} 跳過、{failed} 失敗")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.info("⏹️  使用者中止")
        sys.exit(0)
    except Exception as e:
        logger.exception(f"致命錯誤：{e}")
        sys.exit(1)
