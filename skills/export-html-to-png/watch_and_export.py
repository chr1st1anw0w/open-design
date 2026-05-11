#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
watch_and_export.py — 文件監視與自動導出
========================================
持續監控 skills/ 目錄中的 HTML 檔案變動，自動觸發 HTML 複製 + shot-scraper 截圖。

功能：watchdog 即時監控、mtime manifest 快取、debounce 防抖、自動更新 Gallery。
依賴：pip install watchdog shot-scraper

用法：
  python watch_and_export.py              # 持續監控
  python watch_and_export.py --once       # 單次掃描
  python watch_and_export.py --force      # 強制重處理所有
"""

import argparse, json, logging, shutil, subprocess, sys, threading, time
from pathlib import Path
from typing import Dict, Any, Optional

DEFAULT_SKILLS_DIR = Path("/Users/christianwu/open-design/skills")
DEFAULT_EXPORT_DIR = DEFAULT_SKILLS_DIR / "export-html-to-png"

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s", datefmt="%H:%M:%S")
logger = logging.getLogger("watch_and_export")

SCROLL_JS = "(function(){var e=document.documentElement,b=document.body;var mw=Math.max(e.scrollWidth,b?b.scrollWidth:0),mh=Math.max(e.scrollHeight,b?b.scrollHeight:0),vw=e.clientWidth;return(mw>vw*1.2&&mw>mh)?'horizontal':'vertical';})()"


def detect_direction(p: Path) -> str:
    try:
        r = subprocess.run(["shot-scraper","javascript",str(p.resolve()),SCROLL_JS], capture_output=True, text=True, timeout=30)
        v = r.stdout.strip().strip('"').strip("'")
        return v if v in ("horizontal","vertical") else "vertical"
    except Exception:
        return "vertical"


def take_screenshot(src: Path, dst: Path, direction: str) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    cmd = ["shot-scraper", str(src.resolve()), "-o", str(dst)]
    if direction == "horizontal":
        cmd += ["--width","5120","--height","1080"]
    else:
        cmd += ["--width","1440"]
    subprocess.run(cmd, check=True, timeout=120)


def compute_stem(p: Path, skills_dir: Path) -> str:
    try:
        parts = list(p.relative_to(skills_dir).parts)
        parts[-1] = parts[-1].replace(".html","")
        return "_".join(parts)
    except ValueError:
        return p.stem


# ── Manifest ──

def load_manifest(path: Path) -> Dict[str, Dict[str, Any]]:
    if path.exists():
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            return data if isinstance(data, dict) else {}
        except Exception:
            return {}
    return {}


def save_manifest(manifest: Dict, path: Path) -> None:
    tmp = path.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(path)


# ── 單檔處理 ──

def process_file(html_file: Path, skills_dir: Path, export_dir: Path, manifest: Dict, *, force: bool = False) -> bool:
    s = compute_stem(html_file, skills_dir)
    try:
        mtime = html_file.stat().st_mtime
    except FileNotFoundError:
        return False
    if not force and s in manifest and manifest[s].get("mtime") == mtime:
        return False

    logger.info(f"📝 處理：{s}")
    try:
        shutil.copy2(html_file, export_dir / f"{s}.html")
        d = detect_direction(export_dir / f"{s}.html")
        take_screenshot(export_dir / f"{s}.html", export_dir / f"{s}.png", d)
        manifest[s] = {"mtime": mtime, "src": str(html_file), "direction": d}
        logger.info(f"✅ 完成：{s}")
        return True
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired, Exception) as e:
        logger.error(f"❌ 失敗 {s}：{e}")
        return False


def remove_exported(html_file: Path, skills_dir: Path, export_dir: Path, manifest: Dict) -> bool:
    s = compute_stem(html_file, skills_dir)
    removed = False
    for suffix in (".html", ".png"):
        f = export_dir / f"{s}{suffix}"
        if f.exists():
            f.unlink()
            removed = True
    if s in manifest:
        del manifest[s]
        removed = True
    if removed:
        logger.info(f"🗑️  已移除：{s}")
    return removed


# ── Gallery 更新 ──

def update_gallery(export_dir: Path) -> None:
    script = export_dir / "build_gallery_index.py"
    if not script.exists():
        return
    try:
        subprocess.run([sys.executable, str(script), "--export-dir", str(export_dir)], check=True, timeout=60)
        logger.info("🎨 Gallery 已更新")
    except Exception as e:
        logger.error(f"Gallery 更新失敗：{e}")


# ── 全量掃描 ──

def full_scan(skills_dir: Path, export_dir: Path, manifest: Dict, manifest_path: Path, *, force: bool = False):
    html_files = sorted(f for f in skills_dir.rglob("*.html") if export_dir not in f.parents and f.parent != export_dir)
    if not html_files:
        logger.info("⚠️  未找到任何 HTML"); return 0,0,0
    logger.info(f"📋 共掃描 {len(html_files)} 個 HTML")
    processed = skipped = failed = 0
    for html_file in html_files:
        r = process_file(html_file, skills_dir, export_dir, manifest, force=force)
        if r:
            processed += 1
        else:
            skipped += 1
        if processed > 0 and processed % 20 == 0:
            save_manifest(manifest, manifest_path)
    save_manifest(manifest, manifest_path)
    if processed > 0:
        update_gallery(export_dir)
    logger.info(f"📊 結果：{processed} 處理、{skipped} 跳過")
    return processed, skipped, failed


# ── Watchdog 監控 ──

class _DebouncedHandler:
    def __init__(self, skills_dir, export_dir, manifest, manifest_path, debounce=2.0):
        self.skills_dir, self.export_dir = skills_dir, export_dir
        self.manifest, self.manifest_path = manifest, manifest_path
        self.debounce = debounce
        self._pending: Dict[str, tuple] = {}
        self._lock = threading.Lock()
        self._timer: Optional[threading.Timer] = None

    def on_event(self, evt_type: str, src_path: str):
        p = Path(src_path)
        if p.suffix.lower() != ".html" or not p.is_relative_to(self.skills_dir) or p.is_relative_to(self.export_dir):
            return
        s = compute_stem(p, self.skills_dir)
        with self._lock:
            self._pending[s] = (evt_type, p)
            if self._timer:
                self._timer.cancel()
            self._timer = threading.Timer(self.debounce, self._flush)
            self._timer.start()

    def _flush(self):
        with self._lock:
            batch = dict(self._pending); self._pending.clear(); self._timer = None
        if not batch:
            return
        changed = False
        for _, (evt, path) in batch.items():
            if evt == "deleted":
                changed |= remove_exported(path, self.skills_dir, self.export_dir, self.manifest)
            else:
                changed |= process_file(path, self.skills_dir, self.export_dir, self.manifest, force=True)
        if changed:
            save_manifest(self.manifest, self.manifest_path)
            update_gallery(self.export_dir)

    def cancel(self):
        with self._lock:
            if self._timer:
                self._timer.cancel()


def watch_loop(skills_dir, export_dir, manifest, manifest_path):
    try:
        from watchdog.observers import Observer
        from watchdog.events import FileSystemEventHandler
    except ImportError:
        logger.error("❌ 需要 watchdog：pip install watchdog\n   或改用 --once 模式")
        sys.exit(1)

    dh = _DebouncedHandler(skills_dir, export_dir, manifest, manifest_path)

    class Adapter(FileSystemEventHandler):
        def on_created(self, e):
            if not e.is_directory: dh.on_event("created", e.src_path)
        def on_modified(self, e):
            if not e.is_directory: dh.on_event("modified", e.src_path)
        def on_deleted(self, e):
            if not e.is_directory: dh.on_event("deleted", e.src_path)
        def on_moved(self, e):
            if not e.is_directory:
                dh.on_event("deleted", e.src_path)
                dh.on_event("created", e.dest_path)

    obs = Observer()
    obs.schedule(Adapter(), str(skills_dir), recursive=True)
    obs.start()
    logger.info(f"👁️  監控中：{skills_dir}  （Ctrl+C 停止）")
    try:
        while obs.is_alive():
            obs.join(timeout=1)
    except KeyboardInterrupt:
        logger.info("⏹️  使用者中止")
    finally:
        dh.cancel(); obs.stop(); obs.join()
        save_manifest(manifest, manifest_path)
        logger.info("✅ 已儲存並退出")


# ── CLI ──

def main():
    ap = argparse.ArgumentParser(description="監控 skills/ HTML 變動，自動複製＋截圖")
    ap.add_argument("--skills-dir", type=Path, default=DEFAULT_SKILLS_DIR)
    ap.add_argument("--export-dir", type=Path, default=DEFAULT_EXPORT_DIR)
    ap.add_argument("--once", action="store_true", help="單次掃描，不持續監控")
    ap.add_argument("--force", action="store_true", help="忽略快取，強制重處理")
    ap.add_argument("-v","--verbose", action="store_true")
    args = ap.parse_args()
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    sd = args.skills_dir.expanduser().resolve()
    ed = args.export_dir.expanduser().resolve()
    ed.mkdir(parents=True, exist_ok=True)
    mp = ed / "processed_manifest.json"
    manifest = load_manifest(mp)

    logger.info("🔍 執行初始掃描…")
    full_scan(sd, ed, manifest, mp, force=args.force)
    if args.once:
        logger.info("✅ 單次掃描完成"); return
    watch_loop(sd, ed, manifest, mp)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        logger.exception(f"致命錯誤：{e}"); sys.exit(1)
