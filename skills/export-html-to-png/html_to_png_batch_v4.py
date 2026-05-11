#!/usr/bin/env python3
import subprocess, shutil, json
from pathlib import Path

SKILLS_DIR = Path("/Users/christianwu/open-design/skills")
EXPORT_DIR = Path("/Users/christianwu/open-design/skills/export-html-to-png")

SCROLL_JS = "(function(){var e=document.documentElement,b=document.body;var mw=Math.max(e.scrollWidth,b?b.scrollWidth:0),mh=Math.max(e.scrollHeight,b?b.scrollHeight:0),vw=e.clientWidth;return(mw>vw*1.2&&mw>mh)?'horizontal':'vertical';})()"


def detect(p):
    try:
        r = subprocess.run(["shot-scraper","javascript",str(p.resolve()),SCROLL_JS],
                           capture_output=True,text=True,timeout=30)
        v = r.stdout.strip().strip('"').strip("'")
        return v if v in ("horizontal","vertical") else "vertical"
    except Exception:
        return "vertical"


def screenshot(src, dst, direction):
    dst.parent.mkdir(parents=True, exist_ok=True)
    cmd = ["shot-scraper", str(src.resolve()), "-o", str(dst)]
    if direction == "horizontal":
        cmd += ["--width","5120","--height","1080"]
    else:
        cmd += ["--width","1440"]
    subprocess.run(cmd, check=True, timeout=120)


def stem(p):
    try:
        parts = list(p.relative_to(SKILLS_DIR).parts)
        parts[-1] = parts[-1].replace(".html","")
        return "_".join(parts)
    except ValueError:
        return p.stem

INDEX_HTML = '<!DOCTYPE html>\n<html lang="zh-TW">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width,initial-scale=1.0">\n<title>Skills Gallery</title>\n<style>\n*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}\n:root{\n  --bg:#0f0f10;--surface:#19191c;--s2:#222226;\n  --bd:rgba(255,255,255,0.08);--tx:#e8e8ea;--mt:#888890;\n  --ac:#4f98a3;--ah:#6eb8c4;--r:12px;--g:20px;\n}\nbody{background:var(--bg);color:var(--tx);font-family:-apple-system,"Helvetica Neue",sans-serif;min-height:100vh}\nheader{position:sticky;top:0;z-index:100;background:rgba(15,15,16,.88);\n  backdrop-filter:blur(16px);border-bottom:1px solid var(--bd);\n  padding:14px 24px;display:flex;align-items:center;gap:14px;flex-wrap:wrap}\nheader h1{font-size:17px;font-weight:600}\n.cnt{font-size:12px;color:var(--mt)}\n.sw{flex:1;min-width:200px;max-width:340px;position:relative}\n.sw svg{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--mt);pointer-events:none}\n#q{width:100%;padding:7px 10px 7px 32px;background:var(--s2);border:1px solid var(--bd);\n  border-radius:8px;color:var(--tx);font-size:13px;outline:none}\n#q:focus{border-color:var(--ac)}\n#grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:var(--g);padding:24px}\n.card{background:var(--surface);border:1px solid var(--bd);border-radius:var(--r);\n  overflow:hidden;display:flex;flex-direction:column;\n  transition:transform .18s,box-shadow .18s,border-color .18s}\n.card:hover{transform:translateY(-3px);box-shadow:0 12px 32px rgba(0,0,0,.5);border-color:rgba(79,152,163,.4)}\n.th{cursor:pointer;position:relative;aspect-ratio:16/9;overflow:hidden;background:var(--s2)}\n.th img{width:100%;height:100%;object-fit:cover;object-position:top;transition:transform .3s;display:block}\n.card:hover .th img{transform:scale(1.04)}\n.badge{position:absolute;bottom:7px;right:7px;background:rgba(0,0,0,.6);\n  backdrop-filter:blur(4px);color:#fff;font-size:10px;padding:2px 7px;border-radius:20px;pointer-events:none}\n.np{display:flex;align-items:center;justify-content:center;height:100%;color:var(--mt);font-size:12px}\n.cb{padding:12px 14px 14px;display:flex;flex-direction:column;gap:8px;flex:1}\n.ct{font-size:12px;font-weight:600;color:var(--tx);word-break:break-word;cursor:pointer}\n.ct:hover{color:var(--ah)}\n.cs{font-size:10px;color:var(--mt);word-break:break-all;line-height:1.4}\n.ca{display:flex;gap:7px;margin-top:auto}\n.btn{flex:1;display:inline-flex;align-items:center;justify-content:center;gap:4px;\n  padding:6px 8px;font-size:11px;font-weight:500;border-radius:6px;\n  border:1px solid var(--bd);cursor:pointer;background:var(--s2);color:var(--mt);\n  text-decoration:none;transition:background .15s,color .15s,border-color .15s}\n.btn:hover{background:var(--ac);color:#fff;border-color:var(--ac)}\n.p{background:var(--ac);color:#fff;border-color:var(--ac)}\n.p:hover{background:var(--ah);border-color:var(--ah)}\n#empty{display:none;flex-direction:column;align-items:center;\n  padding:80px 20px;color:var(--mt);gap:10px;font-size:14px;text-align:center}\n#ov{display:none;position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.88);\n  backdrop-filter:blur(8px);align-items:center;justify-content:center}\n#ov.open{display:flex}\n#mo{position:relative;width:92vw;height:90vh;background:#fff;border-radius:14px;\n  overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,.7);display:flex;flex-direction:column}\n#mb{display:flex;align-items:center;gap:8px;padding:9px 14px;\n  background:var(--s2);border-bottom:1px solid var(--bd);flex-shrink:0}\n#mt2{flex:1;font-size:12px;color:var(--tx);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n#mc{cursor:pointer;background:none;border:none;color:var(--mt);font-size:22px;line-height:1;padding:2px 6px;border-radius:5px}\n#mc:hover{background:var(--surface);color:var(--tx)}\n#mf{flex:1;border:none;width:100%}\n#toast{display:none;position:fixed;bottom:28px;left:50%;transform:translateX(-50%);\n  background:rgba(79,152,163,.95);color:#fff;padding:9px 20px;border-radius:24px;\n  font-size:13px;z-index:999;box-shadow:0 4px 20px rgba(0,0,0,.4);pointer-events:none}\n</style>\n</head>\n<body>\n<header>\n  <h1>&#127912; Skills Gallery</h1>\n  <span class="cnt" id="cl"></span>\n  <div class="sw">\n    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">\n      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>\n    </svg>\n    <input id="q" type="text" placeholder="搜尋 skill 名稱…" autocomplete="off">\n  </div>\n</header>\n<div id="grid"></div>\n<div id="empty"><span style="font-size:38px">&#128269;</span>找不到符合的 Skill</div>\n<div id="ov">\n  <div id="mo">\n    <div id="mb">\n      <span id="mt2"></span>\n      <a id="mtab" href="#" target="_blank" class="btn p" style="flex:0;white-space:nowrap">&#8599; 新分頁</a>\n      <button id="mc">&#215;</button>\n    </div>\n    <iframe id="mf" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"></iframe>\n  </div>\n</div>\n<div id="toast"></div>\n<script>\nvar R=__RECORDS__;\nvar grid=document.getElementById(\'grid\'),empty=document.getElementById(\'empty\'),cl=document.getElementById(\'cl\');\nvar ov=document.getElementById(\'ov\'),mf=document.getElementById(\'mf\'),mt2=document.getElementById(\'mt2\'),mtab=document.getElementById(\'mtab\');\nfunction openM(h,t){mf.src=h;mt2.textContent=t;mtab.href=h;ov.classList.add(\'open\');document.body.style.overflow=\'hidden\';}\nfunction closeM(){ov.classList.remove(\'open\');mf.src=\'about:blank\';document.body.style.overflow=\'\';}\ndocument.getElementById(\'mc\').addEventListener(\'click\',closeM);\nov.addEventListener(\'click\',function(e){if(e.target===ov)closeM();});\ndocument.addEventListener(\'keydown\',function(e){if(e.key===\'Escape\')closeM();});\nfunction toast(m){var t=document.getElementById(\'toast\');t.textContent=m;t.style.display=\'block\';clearTimeout(t._x);t._x=setTimeout(function(){t.style.display=\'none\';},3000);}\nfunction copyPath(d){if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(d).then(function(){toast(\'&#128203; 路徑已複製！在 Finder 按 ⌘⇧G 貼上跳轉\');});}else{prompt(\'路徑（在 Finder 按 ⌘⇧G 貼上）：\',d);}}\nfunction render(list){\n  grid.innerHTML=\'\';empty.style.display=list.length?\'none\':\'flex\';\n  cl.textContent=list.length+\' / \'+R.length+\' skills\';\n  list.forEach(function(r){\n    var has=r.png_export&&r.png_export.length>0;\n    var th=has?\'<img src="\'+r.png_export+\'" alt="\'+r.stem+\'" loading="lazy"><span class="badge">HTML</span>\':\'<div class="np">&#128444; 截圖未產生</div>\';\n    var c=document.createElement(\'div\');c.className=\'card\';\n    c.innerHTML=\'<div class="th">\'+th+\'</div>\'\n      +\'<div class="cb">\'\n        +\'<span class="ct">\'+r.stem+\'</span>\'\n        +\'<div class="cs">\'+r.html_src.replace(\'/Users/christianwu/open-design/skills/\',\'\')+\'</div>\'\n        +\'<div class="ca"><button class="btn fb">&#128193; Finder</button>\'\n        +\'<a class="btn p" href="\'+r.html_export+\'" target="_blank">&#8599; 開啟</a></div>\'\n      +\'</div>\';\n    c.querySelector(\'.th\').addEventListener(\'click\',function(){openM(r.html_export,r.stem);});\n    c.querySelector(\'.ct\').addEventListener(\'click\',function(){window.open(r.html_export,\'_blank\');});\n    c.querySelector(\'.fb\').addEventListener(\'click\',function(){copyPath(r.original_dir);});\n    grid.appendChild(c);\n  });\n}\ndocument.getElementById(\'q\').addEventListener(\'input\',function(){\n  var q=this.value.trim().toLowerCase();\n  render(q?R.filter(function(r){return r.stem.toLowerCase().includes(q)||r.html_src.toLowerCase().includes(q);}):R);\n});\nrender(R);\n</script>\n</body>\n</html>\n'


def gen_index(records):
    rj = json.dumps(records, ensure_ascii=False)
    content = INDEX_HTML.replace("__RECORDS__", rj)
    out = EXPORT_DIR / "index.html"
    out.write_text(content, encoding="utf-8")
    print(f"✅ index.html 產生：{out}")


def main():
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)

    html_files = sorted([
        f for f in SKILLS_DIR.rglob("*.html")
        if EXPORT_DIR not in f.parents and f.parent != EXPORT_DIR
    ])

    if not html_files:
        print("⚠️  未找到任何 HTML 檔案"); return

    total = len(html_files)
    print(f"📋 共找到 {total} 個 HTML 檔案\n")
    success, failed, records = [], [], []

    for i, html_file in enumerate(html_files, 1):
        rel = html_file.relative_to(SKILLS_DIR)
        print(f"[{i:>3}/{total}] {rel}")

        s           = stem(html_file)
        html_export = s + ".html"
        png_export  = s + ".png"
        record      = {
            "stem": s,
            "html_src": str(html_file),
            "html_export": html_export,
            "png_export": "",
            "original_dir": str(html_file.parent),
        }

        try:
            shutil.copy2(html_file, EXPORT_DIR / html_export)
            d = detect(html_file)
            print(f"         方向：{d}")
            png_src = html_file.with_suffix(".png")
            screenshot(html_file, png_src, d)
            shutil.copy2(png_src, EXPORT_DIR / png_export)
            record["png_export"] = png_export
            print(f"         ✅ 完成\n")
            success.append(html_file)
        except subprocess.CalledProcessError as e:
            print(f"         ❌ 截圖失敗（HTML已複製）：{e}\n")
            failed.append(html_file)
        except subprocess.TimeoutExpired:
            print(f"         ❌ 逾時（HTML已複製）\n")
            failed.append(html_file)
        except Exception as e:
            print(f"         ❌ 錯誤：{e}\n")
            failed.append(html_file)

        records.append(record)

    print("⚙️  產生 index.html…")
    gen_index(records)

    print("\n" + "─" * 60)
    print(f"🎉 完成！成功 {len(success)} / 失敗 {len(failed)}")
    print(f"📁 匯出目錄：{EXPORT_DIR}")
    print(f"🌐 Gallery：{EXPORT_DIR}/index.html")
    if failed:
        print("\n截圖失敗（HTML 已複製）：")
        for f in failed:
            print(f"  • {f.relative_to(SKILLS_DIR)}")


if __name__ == "__main__":
    main()
