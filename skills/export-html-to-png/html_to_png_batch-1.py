#!/usr/bin/env python3
"""
html_to_png_batch.py  ·  v3
============================
1. 掃描 SKILLS_DIR 底下所有 HTML（排除 EXPORT_DIR）
2. 複製每個 HTML 到 EXPORT_DIR（保留子路徑前綴命名，避免衝突）
3. 截圖為同名 PNG：
   - 垂直捲動 → width=1440，不傳 height（shot-scraper 自動全高）
   - 水平捲動 → width=5120, height=1080
4. 在 EXPORT_DIR 產生 index.html：
   - 卡片式版面，顯示 PNG 縮圖
   - 點縮圖 → 在新分頁開啟對應 HTML（互動操作）
   - 點「📁 Finder」按鈕 → 用 `open -R` 在 Finder 中顯示原始 HTML 所在資料夾
   - 點「📄 檔名」→ 也開啟 HTML
"""

import subprocess
import shutil
import json
from pathlib import Path

SKILLS_DIR = Path("/Users/christianwu/open-design/skills")
EXPORT_DIR = Path("/Users/christianwu/open-design/skills/export-html-to-png")

SCROLL_DETECT_JS = """
(function() {
    var el   = document.documentElement;
    var body = document.body;
    var maxW = Math.max(el.scrollWidth,  body ? body.scrollWidth  : 0);
    var maxH = Math.max(el.scrollHeight, body ? body.scrollHeight : 0);
    var vw   = el.clientWidth;
    var isHorizontal = (maxW > vw * 1.2) && (maxW > maxH);
    return isHorizontal ? "horizontal" : "vertical";
})()
"""

def detect_scroll_direction(html_path: Path) -> str:
    try:
        result = subprocess.run(
            ["shot-scraper", "javascript", str(html_path.resolve()), SCROLL_DETECT_JS],
            capture_output=True, text=True, timeout=30,
        )
        raw = result.stdout.strip().strip('"').strip("'")
        return raw if raw in ("horizontal", "vertical") else "vertical"
    except Exception:
        return "vertical"


def take_screenshot(html_path: Path, output_png: Path, direction: str):
    output_png.parent.mkdir(parents=True, exist_ok=True)
    cmd = ["shot-scraper", str(html_path.resolve()), "-o", str(output_png)]
    if direction == "horizontal":
        cmd += ["--width", "5120", "--height", "1080"]
    else:
        cmd += ["--width", "1440"]   # 不傳 --height → 自動截完整頁面高度
    subprocess.run(cmd, check=True, timeout=120)


def build_export_stem(html_path: Path) -> str:
    """用相對路徑組成無衝突的 export 檔名前綴（不含副檔名）"""
    try:
        relative = html_path.relative_to(SKILLS_DIR)
        parts = list(relative.parts)
        parts[-1] = parts[-1].replace(".html", "")
        return "_".join(parts)
    except ValueError:
        return html_path.stem


def generate_index(records: list[dict]):
    """
    records 每筆: {
        stem: str,          # export 無衝突名稱（無副檔名）
        html_src: str,      # 原始 HTML 絕對路徑
        html_export: str,   # EXPORT_DIR 內複製後的 HTML 路徑（相對於 EXPORT_DIR）
        png_export: str,    # EXPORT_DIR 內 PNG 路徑（相對於 EXPORT_DIR）
        original_dir: str,  # 原始所在目錄絕對路徑
    }
    """
    records_json = json.dumps(records, ensure_ascii=False, indent=2)

    html = f"""<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>HTML Skills Gallery</title>
<style>
  *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}

  :root {{
    --bg:        #0f0f10;
    --surface:   #19191c;
    --surface2:  #222226;
    --border:    rgba(255,255,255,0.08);
    --text:      #e8e8ea;
    --muted:     #888890;
    --accent:    #4f98a3;
    --accent-h:  #6eb8c4;
    --radius:    12px;
    --gap:       20px;
  }}

  body {{
    background: var(--bg);
    color: var(--text);
    font-family: -apple-system, "SF Pro Display", "Helvetica Neue", sans-serif;
    min-height: 100vh;
  }}

  /* ── Header ── */
  header {{
    position: sticky; top: 0; z-index: 100;
    background: rgba(15,15,16,0.85);
    backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--border);
    padding: 16px 28px;
    display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
  }}
  header h1 {{ font-size: 18px; font-weight: 600; letter-spacing: -0.3px; }}
  header .count {{ font-size: 13px; color: var(--muted); }}

  .search-wrap {{ flex: 1; min-width: 220px; max-width: 360px; position: relative; }}
  .search-wrap svg {{
    position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
    color: var(--muted); pointer-events: none;
  }}
  #search {{
    width: 100%; padding: 8px 12px 8px 36px;
    background: var(--surface2); border: 1px solid var(--border);
    border-radius: 8px; color: var(--text); font-size: 14px; outline: none;
  }}
  #search:focus {{ border-color: var(--accent); }}

  /* ── Grid ── */
  #grid {{
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--gap);
    padding: 28px;
  }}

  /* ── Card ── */
  .card {{
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    display: flex; flex-direction: column;
    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
  }}
  .card:hover {{
    transform: translateY(-3px);
    box-shadow: 0 12px 32px rgba(0,0,0,0.45);
    border-color: rgba(79,152,163,0.4);
  }}

  /* 縮圖區：點擊開啟 HTML */
  .thumb-wrap {{
    cursor: pointer;
    position: relative;
    aspect-ratio: 16/9;
    overflow: hidden;
    background: var(--surface2);
  }}
  .thumb-wrap img {{
    width: 100%; height: 100%;
    object-fit: cover; object-position: top;
    transition: transform 0.3s ease;
    display: block;
  }}
  .card:hover .thumb-wrap img {{ transform: scale(1.03); }}

  /* 縮圖 overlay badge */
  .thumb-wrap .badge {{
    position: absolute; bottom: 8px; right: 8px;
    background: rgba(0,0,0,0.6); backdrop-filter: blur(6px);
    color: #fff; font-size: 10px; padding: 3px 7px;
    border-radius: 20px; pointer-events: none;
  }}

  /* 縮圖無 PNG 時的 placeholder */
  .no-thumb {{
    display: flex; align-items: center; justify-content: center;
    height: 100%; color: var(--muted); font-size: 13px;
  }}

  /* ── Card body ── */
  .card-body {{
    padding: 14px 16px 16px;
    display: flex; flex-direction: column; gap: 10px; flex: 1;
  }}

  .card-title {{
    font-size: 13px; font-weight: 600; line-height: 1.4;
    color: var(--text); word-break: break-word;
    cursor: pointer;
    text-decoration: none;
  }}
  .card-title:hover {{ color: var(--accent-h); }}

  .card-sub {{
    font-size: 11px; color: var(--muted); word-break: break-all;
  }}

  .card-actions {{
    display: flex; gap: 8px; margin-top: auto;
  }}

  .btn {{
    flex: 1; display: inline-flex; align-items: center; justify-content: center;
    gap: 5px; padding: 7px 10px;
    font-size: 11px; font-weight: 500; border-radius: 7px;
    border: 1px solid var(--border); cursor: pointer;
    background: var(--surface2); color: var(--muted);
    text-decoration: none;
    transition: background 0.15s, color 0.15s, border-color 0.15s;
  }}
  .btn:hover {{ background: var(--accent); color: #fff; border-color: var(--accent); }}
  .btn.primary {{ background: var(--accent); color: #fff; border-color: var(--accent); }}
  .btn.primary:hover {{ background: var(--accent-h); border-color: var(--accent-h); }}

  /* ── Empty state ── */
  #empty {{
    display: none; flex-direction: column; align-items: center;
    padding: 80px 20px; color: var(--muted); gap: 12px;
    font-size: 15px; text-align: center;
  }}

  /* ── Modal / Lightbox for HTML preview ── */
  #modal-overlay {{
    display: none; position: fixed; inset: 0; z-index: 200;
    background: rgba(0,0,0,0.85); backdrop-filter: blur(8px);
    align-items: center; justify-content: center;
  }}
  #modal-overlay.open {{ display: flex; }}
  #modal-box {{
    position: relative; width: 90vw; height: 88vh;
    background: #fff; border-radius: 16px; overflow: hidden;
    box-shadow: 0 24px 80px rgba(0,0,0,0.6);
    display: flex; flex-direction: column;
  }}
  #modal-bar {{
    display: flex; align-items: center; gap: 10px;
    padding: 10px 16px;
    background: var(--surface2); border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }}
  #modal-title {{
    flex: 1; font-size: 13px; color: var(--text);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }}
  #modal-close {{
    cursor: pointer; background: none; border: none; color: var(--muted);
    font-size: 22px; line-height: 1; padding: 2px 6px; border-radius: 6px;
  }}
  #modal-close:hover {{ background: var(--surface); color: var(--text); }}
  #modal-iframe {{
    flex: 1; border: none; width: 100%;
  }}
</style>
</head>
<body>

<header>
  <h1>🎨 Skills Gallery</h1>
  <span class="count" id="count-label"></span>
  <div class="search-wrap">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="2">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
    <input id="search" type="text" placeholder="搜尋 skill 名稱…" autocomplete="off">
  </div>
</header>

<div id="grid"></div>
<div id="empty">
  <span style="font-size:40px">🔍</span>
  找不到符合的 Skill
</div>

<!-- Modal -->
<div id="modal-overlay">
  <div id="modal-box">
    <div id="modal-bar">
      <span id="modal-title"></span>
      <a id="modal-open-tab" href="#" target="_blank" class="btn" style="flex:0;white-space:nowrap">↗ 新分頁</a>
      <button id="modal-close">×</button>
    </div>
    <iframe id="modal-iframe" sandbox="allow-scripts allow-same-origin allow-forms allow-popups"></iframe>
  </div>
</div>

<script>
const RECORDS = {records_json};

const grid      = document.getElementById('grid');
const emptyEl   = document.getElementById('empty');
const searchEl  = document.getElementById('search');
const countEl   = document.getElementById('count-label');
const overlay   = document.getElementById('modal-overlay');
const iframe    = document.getElementById('modal-iframe');
const modalTitle = document.getElementById('modal-title');
const modalTab  = document.getElementById('modal-open-tab');

// ── 開啟 Modal ──
function openModal(htmlRel, title) {{
  iframe.src = htmlRel;
  modalTitle.textContent = title;
  modalTab.href = htmlRel;
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}}
function closeModal() {{
  overlay.classList.remove('open');
  iframe.src = 'about:blank';
  document.body.style.overflow = '';
}}
document.getElementById('modal-close').addEventListener('click', closeModal);
overlay.addEventListener('click', e => {{ if (e.target === overlay) closeModal(); }});
document.addEventListener('keydown', e => {{ if (e.key === 'Escape') closeModal(); }});

// ── 在 Finder 中開啟（透過 AppleScript）──
// 由於純 HTML 無法直接呼叫系統指令，改用 macOS 的 file:// scheme open
// 使用者點按後，瀏覽器以 file:// 開啟原始資料夾下的 HTML，同時提示路徑
function openInFinder(originalDir) {{
  // 將絕對路徑轉為 file:// URL 並嘗試開啟目錄
  // macOS Safari/Chrome 不支援直接開啟 file:// 目錄
  // 改用 clipboard 複製路徑 + alert 提示
  if (navigator.clipboard && navigator.clipboard.writeText) {{
    navigator.clipboard.writeText(originalDir).then(() => {{
      showToast('📋 路徑已複製！在 Finder 按 ⌘⇧G 貼上即可跳轉');
    }});
  }} else {{
    prompt('複製此路徑，在 Finder 按 ⌘⇧G 貼上：', originalDir);
  }}
}}

// ── Toast ──
function showToast(msg) {{
  let t = document.getElementById('toast');
  if (!t) {{
    t = document.createElement('div');
    t.id = 'toast';
    Object.assign(t.style, {{
      position:'fixed', bottom:'28px', left:'50%', transform:'translateX(-50%)',
      background:'rgba(79,152,163,0.95)', color:'#fff', padding:'10px 20px',
      borderRadius:'24px', fontSize:'13px', zIndex:'999',
      boxShadow:'0 4px 20px rgba(0,0,0,0.4)', pointerEvents:'none',
      transition:'opacity 0.3s'
    }});
    document.body.appendChild(t);
  }}
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => {{ t.style.opacity = '0'; }}, 3000);
}}

// ── 渲染卡片 ──
function renderCards(list) {{
  grid.innerHTML = '';
  emptyEl.style.display = list.length ? 'none' : 'flex';
  countEl.textContent = list.length + ' / ' + RECORDS.length + ' skills';

  list.forEach(r => {{
    const card = document.createElement('div');
    card.className = 'card';

    const pngExists = r.png_export && r.png_export.length > 0;
    const thumbHTML = pngExists
      ? `<img src="${{r.png_export}}" alt="${{r.stem}}" loading="lazy">
         <span class="badge">HTML</span>`
      : `<div class="no-thumb">🖼 截圖未產生</div>`;

    card.innerHTML = `
      <div class="thumb-wrap" title="點擊預覽互動 HTML">
        ${{thumbHTML}}
      </div>
      <div class="card-body">
        <a class="card-title" title="${{r.html_src}}">${{r.stem}}</a>
        <div class="card-sub">${{r.html_src.replace('/Users/christianwu/open-design/skills/', '')}}</div>
        <div class="card-actions">
          <button class="btn finder-btn" data-dir="${{r.original_dir}}">📁 Finder 路徑</button>
          <a class="btn primary" href="${{r.html_export}}" target="_blank">↗ 開啟 HTML</a>
        </div>
      </div>
    `;

    // 縮圖點擊 → Modal 預覽
    card.querySelector('.thumb-wrap').addEventListener('click', () => {{
      openModal(r.html_export, r.stem);
    }});

    // 標題點擊 → 新分頁直接開啟
    card.querySelector('.card-title').addEventListener('click', () => {{
      window.open(r.html_export, '_blank');
    }});

    // Finder 按鈕 → 複製路徑
    card.querySelector('.finder-btn').addEventListener('click', () => {{
      openInFinder(r.original_dir);
    }});

    grid.appendChild(card);
  }});
}}

// ── 搜尋 ──
searchEl.addEventListener('input', () => {{
  const q = searchEl.value.trim().toLowerCase();
  const filtered = q
    ? RECORDS.filter(r => r.stem.toLowerCase().includes(q) || r.html_src.toLowerCase().includes(q))
    : RECORDS;
  renderCards(filtered);
}});

renderCards(RECORDS);
</script>
</body>
</html>
"""
    index_path = EXPORT_DIR / "index.html"
    index_path.write_text(html.replace("{records_json}", records_json), encoding="utf-8")
    print(f"✅ index.html 已產生：{index_path}")


# ───────────────────────────────────────────
def main():
    EXPORT_DIR.mkdir(parents=True, exist_ok=True)

    html_files = sorted([
        f for f in SKILLS_DIR.rglob("*.html")
        if EXPORT_DIR not in f.parents and f.parent != EXPORT_DIR
    ])

    if not html_files:
        print("⚠️  未找到任何 HTML 檔案")
        return

    print(f"📋 共找到 {len(html_files)} 個 HTML 檔案\n")
    success, failed = [], []
    records = []

    for i, html_file in enumerate(html_files, 1):
        rel = html_file.relative_to(SKILLS_DIR)
        print(f"[{i:>3}/{len(html_files)}] {rel}")

        stem         = build_export_stem(html_file)
        html_export  = f"{stem}.html"
        png_export   = f"{stem}.png"
        dest_html    = EXPORT_DIR / html_export
        dest_png     = EXPORT_DIR / png_export

        try:
            # 1. 複製 HTML 到 EXPORT_DIR
            shutil.copy2(html_file, dest_html)

            # 2. 偵測捲動方向
            direction = detect_scroll_direction(html_file)
            print(f"         捲動方向：{direction}")

            # 3. 截圖 → 存在原始同目錄
            same_dir_png = html_file.with_suffix(".png")
            take_screenshot(html_file, same_dir_png, direction)
            print(f"         ✅ 截圖：{same_dir_png.name}")

            # 4. 複製 PNG 到 EXPORT_DIR
            shutil.copy2(same_dir_png, dest_png)
            print(f"         📦 匯出：{png_export}\n")

            records.append({
                "stem":        stem,
                "html_src":    str(html_file),
                "html_export": html_export,
                "png_export":  png_export,
                "original_dir": str(html_file.parent),
            })
            success.append(html_file)

        except subprocess.CalledProcessError as e:
            print(f"         ❌ 截圖失敗：{e}\n")
            # 截圖失敗仍保留 HTML 複製，PNG 留空
            records.append({
                "stem":        stem,
                "html_src":    str(html_file),
                "html_export": html_export,
                "png_export":  "",
                "original_dir": str(html_file.parent),
            })
            failed.append(html_file)
        except subprocess.TimeoutExpired:
            print(f"         ❌ 逾時跳過\n")
            records.append({
                "stem":        stem,
                "html_src":    str(html_file),
                "html_export": html_export,
                "png_export":  "",
                "original_dir": str(html_file.parent),
            })
            failed.append(html_file)
        except Exception as e:
            print(f"         ❌ 未預期錯誤：{e}\n")
            failed.append(html_file)

    # 5. 產生 index.html
    print("\n⚙️  正在產生 index.html …")
    generate_index(records)

    print("\n" + "─" * 60)
    print(f"🎉 完成！成功 {len(success)} 個 / 失敗 {len(failed)} 個")
    print(f"📁 統一匯出目錄：{EXPORT_DIR}")
    print(f"🌐 Gallery 入口：{EXPORT_DIR}/index.html")

    if failed:
        print("\n失敗清單（HTML 已複製，截圖未完成）：")
        for f in failed:
            print(f"  • {f.relative_to(SKILLS_DIR)}")


if __name__ == "__main__":
    main()
