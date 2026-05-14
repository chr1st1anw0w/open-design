#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Pack ChatGPT / Skillshare skill folders into upload-friendly Markdown files.

Source:
  /Users/christianwu/open-design/skills

Output:
  /Users/christianwu/.config/skillshare/skills/chatgpt-skills-pack

Behavior:
- Each skill folder becomes one Markdown file.
- SKILL.md is placed first when available.
- Related reference files are appended with fenced code blocks.
- Binary / heavy / cache files are skipped.
- Generates index.md for routing.
- Generates manifest.json for audit.
"""

from __future__ import annotations

import hashlib
import json
import shutil
from datetime import datetime
from pathlib import Path
from typing import Iterable


SOURCE_DIR = Path("/Users/christianwu/open-design/skills")
OUTPUT_DIR = Path("/Users/christianwu/.config/skillshare/skills/chatgpt-skills-pack")

INCLUDE_EXTS = {
    ".md",
    ".mdx",
    ".txt",
    ".json",
    ".jsonc",
    ".yaml",
    ".yml",
    ".toml",
    ".py",
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".sh",
    ".bash",
    ".zsh",
    ".html",
    ".css",
    ".scss",
    ".xml",
    ".csv",
}

SKIP_DIRS = {
    ".git",
    ".github",
    ".vscode",
    ".idea",
    "__pycache__",
    ".pytest_cache",
    ".mypy_cache",
    ".ruff_cache",
    "node_modules",
    "dist",
    "build",
    ".next",
    ".nuxt",
    ".turbo",
    ".cache",
    "coverage",
    "tmp",
    "temp",
    "logs",
    ".DS_Store",
}

SKIP_FILE_NAMES = {
    ".DS_Store",
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "bun.lockb",
}

MAX_FILE_SIZE_BYTES = 1_000_000
MAX_OUTPUT_SIZE_CHARS = 1_800_000


def slugify(name: str) -> str:
    allowed = []
    last_dash = False

    for char in name.strip().lower():
        if char.isalnum():
            allowed.append(char)
            last_dash = False
        elif char in {" ", "_", "-", ".", "/"}:
            if not last_dash:
                allowed.append("-")
                last_dash = True

    slug = "".join(allowed).strip("-")
    return slug or "untitled-skill"


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8", errors="ignore")).hexdigest()


def lang_for(path: Path) -> str:
    ext = path.suffix.lower()

    return {
        ".md": "markdown",
        ".mdx": "mdx",
        ".txt": "text",
        ".json": "json",
        ".jsonc": "jsonc",
        ".yaml": "yaml",
        ".yml": "yaml",
        ".toml": "toml",
        ".py": "python",
        ".js": "javascript",
        ".jsx": "jsx",
        ".ts": "typescript",
        ".tsx": "tsx",
        ".sh": "bash",
        ".bash": "bash",
        ".zsh": "zsh",
        ".html": "html",
        ".css": "css",
        ".scss": "scss",
        ".xml": "xml",
        ".csv": "csv",
    }.get(ext, "text")


def should_skip_dir(path: Path) -> bool:
    return path.name in SKIP_DIRS or path.name.startswith(".")


def should_skip_file(path: Path) -> bool:
    if path.name in SKIP_FILE_NAMES:
        return True

    if path.suffix.lower() not in INCLUDE_EXTS:
        return True

    try:
        if path.stat().st_size > MAX_FILE_SIZE_BYTES:
            return True
    except OSError:
        return True

    return False


def safe_read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8", errors="ignore")
    except Exception as exc:
        return f"[READ_ERROR] {type(exc).__name__}: {exc}"


def iter_skill_dirs(source_dir: Path) -> Iterable[Path]:
    for item in sorted(source_dir.iterdir(), key=lambda p: p.name.lower()):
        if item.is_dir() and not should_skip_dir(item):
            yield item


def iter_reference_files(skill_dir: Path) -> Iterable[Path]:
    files: list[Path] = []

    for path in skill_dir.rglob("*"):
        if not path.is_file():
            continue

        if any(part in SKIP_DIRS for part in path.parts):
            continue

        if should_skip_file(path):
            continue

        files.append(path)

    def sort_key(path: Path) -> tuple[int, str]:
        rel = path.relative_to(skill_dir).as_posix().lower()

        if path.name == "SKILL.md":
            return (0, rel)
        if path.suffix.lower() == ".md":
            return (1, rel)
        if path.suffix.lower() in {".json", ".jsonc", ".yaml", ".yml", ".toml"}:
            return (2, rel)
        if path.suffix.lower() in {".py", ".js", ".jsx", ".ts", ".tsx", ".sh", ".bash", ".zsh"}:
            return (3, rel)

        return (9, rel)

    return sorted(files, key=sort_key)


def clean_output_dir(output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)

    for item in output_dir.iterdir():
        if item.is_file():
            item.unlink()
        elif item.is_dir():
            shutil.rmtree(item)


def build_skill_markdown(skill_dir: Path) -> tuple[str, dict]:
    skill_name = skill_dir.name
    source_path = skill_dir.as_posix()

    parts: list[str] = [
        f"# Skill: {skill_name}",
        "",
        "## Metadata",
        "",
        f"- Source: `{source_path}`",
        f"- Packed at: `{datetime.now().isoformat(timespec='seconds')}`",
        "",
        "---",
        "",
    ]

    file_records = []
    total_chars = sum(len(part) for part in parts)

    for file_path in iter_reference_files(skill_dir):
        rel_path = file_path.relative_to(skill_dir).as_posix()
        content = safe_read_text(file_path)
        language = lang_for(file_path)

        section = (
            f"\n## File: `{rel_path}`\n\n"
            f"```{language}\n"
            f"{content}\n"
            f"```\n"
        )

        if total_chars + len(section) > MAX_OUTPUT_SIZE_CHARS:
            parts.append(
                "\n## Packing Notice\n\n"
                f"- Output size limit reached at `{MAX_OUTPUT_SIZE_CHARS}` characters.\n"
                f"- Remaining files after `{rel_path}` were skipped.\n"
            )
            break

        parts.append(section)
        total_chars += len(section)

        file_records.append(
            {
                "relative_path": rel_path,
                "size_bytes": file_path.stat().st_size,
                "sha256": hashlib.sha256(
                    file_path.read_bytes()
                ).hexdigest(),
            }
        )

    markdown = "\n".join(parts)

    manifest_record = {
        "skill_name": skill_name,
        "source_path": source_path,
        "output_file": f"{slugify(skill_name)}.md",
        "file_count": len(file_records),
        "source_files": file_records,
        "output_chars": len(markdown),
        "output_sha256": sha256_text(markdown),
    }

    return markdown, manifest_record


def build_index(manifest_records: list[dict]) -> str:
    lines = [
        "# ChatGPT Skills Pack Index",
        "",
        "此檔案用於 ChatGPT Project files / Skillshare 形式的技能路由。",
        "",
        "## Usage Rule",
        "",
        "When handling a user task, first identify the closest matching skill below, then consult the corresponding packed skill file.",
        "",
        "## Skills",
        "",
    ]

    for record in manifest_records:
        skill_name = record["skill_name"]
        output_file = record["output_file"]
        file_count = record["file_count"]

        lines.extend(
            [
                f"### {skill_name}",
                "",
                f"- Packed file: `{output_file}`",
                f"- Source files included: `{file_count}`",
                "",
            ]
        )

    return "\n".join(lines)


def main() -> None:
    if not SOURCE_DIR.exists():
        raise FileNotFoundError(f"Source directory does not exist: {SOURCE_DIR}")

    if not SOURCE_DIR.is_dir():
        raise NotADirectoryError(f"Source path is not a directory: {SOURCE_DIR}")

    clean_output_dir(OUTPUT_DIR)

    manifest_records: list[dict] = []

    skill_dirs = list(iter_skill_dirs(SOURCE_DIR))

    if not skill_dirs:
        raise RuntimeError(f"No skill folders found under: {SOURCE_DIR}")

    for skill_dir in skill_dirs:
        markdown, record = build_skill_markdown(skill_dir)

        output_file = OUTPUT_DIR / record["output_file"]
        output_file.write_text(markdown, encoding="utf-8")

        manifest_records.append(record)

    index_md = build_index(manifest_records)
    index_path = OUTPUT_DIR / "index.md"
    index_path.write_text(index_md, encoding="utf-8")

    manifest = {
        "source_dir": SOURCE_DIR.as_posix(),
        "output_dir": OUTPUT_DIR.as_posix(),
        "packed_at": datetime.now().isoformat(timespec="seconds"),
        "skill_count": len(manifest_records),
        "skills": manifest_records,
    }

    manifest_path = OUTPUT_DIR / "manifest.json"
    manifest_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print("Packing completed.")
    print(f"Source: {SOURCE_DIR}")
    print(f"Output: {OUTPUT_DIR}")
    print(f"Skills packed: {len(manifest_records)}")
    print("")
    print("Generated files:")
    print(f"- {index_path}")
    print(f"- {manifest_path}")

    for record in manifest_records:
        print(f"- {OUTPUT_DIR / record['output_file']}")


if __name__ == "__main__":
    main()