#!/usr/bin/env python3
"""Render skill example.html files to thumbnail images.

The script uses the repository's Node Playwright dependency, so it does not
require installing the Python playwright package. By default it writes
`thumbnail.png` beside every `skills/*/example.html` that is missing a
thumbnail. Pass `--force` to refresh existing thumbnails.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SKILLS_DIR = ROOT / "skills"


def collect_examples(force: bool, only: str | None) -> list[dict[str, str | int]]:
    items: list[dict[str, str | int]] = []
    for skill_dir in sorted(SKILLS_DIR.iterdir()):
        if not skill_dir.is_dir():
            continue
        if only and skill_dir.name != only:
            continue
        source = skill_dir / "example.html"
        target = skill_dir / "thumbnail.png"
        if not source.exists():
            continue
        if target.exists() and not force:
            continue
        viewport = infer_viewport(skill_dir / "SKILL.md")
        items.append({
            "source": str(source),
            "target": str(target),
            "width": viewport[0],
            "height": viewport[1],
        })
    return items


def infer_viewport(skill_path: Path) -> tuple[int, int]:
    try:
        text = skill_path.read_text(encoding="utf-8").lower()
    except OSError:
        return (1440, 1000)
    frontmatter = text.split("---", 2)[1] if text.startswith("---") and text.count("---") >= 2 else text
    if "mode: deck" in frontmatter or "od.mode: deck" in frontmatter or "ppt" in frontmatter:
        return (1600, 900)
    if "platform: mobile" in frontmatter or "od.platform: mobile" in frontmatter:
        return (390, 844)
    return (1440, 1000)


def render(items: list[dict[str, str | int]]) -> None:
    if not items:
        print("No thumbnails to render.")
        return

    playwright_anchor = json.dumps(str(ROOT / "e2e" / "package.json"))
    node_script = """
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';

const require = createRequire(__PLAYWRIGHT_ANCHOR__);
const { chromium } = require('@playwright/test');
const items = JSON.parse(await readFile(process.argv[2], 'utf8'));
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });

for (const item of items) {
  await page.setViewportSize({ width: Number(item.width), height: Number(item.height) });
  await page.goto(`file://${item.source}`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: item.target, type: 'png', fullPage: false });
  console.log(`[thumb] ${item.width}x${item.height} ${item.target}`);
}

await browser.close();
""".replace("__PLAYWRIGHT_ANCHOR__", playwright_anchor)

    tmp = ROOT / ".tmp" / f"skill-thumbnails-{os.getpid()}"
    tmp.mkdir(parents=True, exist_ok=True)
    manifest = tmp / "items.json"
    runner = tmp / "render.mjs"
    manifest.write_text(json.dumps(items), encoding="utf-8")
    runner.write_text(node_script, encoding="utf-8")
    subprocess.run(
        ["node", str(runner), str(manifest)],
        cwd=ROOT,
        check=True,
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true", help="refresh existing thumbnails")
    parser.add_argument("--only", help="render one skill directory name")
    args = parser.parse_args()

    render(collect_examples(args.force, args.only))


if __name__ == "__main__":
    main()
