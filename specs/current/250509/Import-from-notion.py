#!/usr/bin/env python3
"""Notion → local markdown 批量同步（並行、最省 token）"""

import os, concurrent.futures, pathlib, requests

NOTION_TOKEN = os.environ["NOTION_TOKEN"]
OUT_DIR = pathlib.Path("/Users/christianwu/open-design/specs/current/250509")
OUT_DIR.mkdir(parents=True, exist_ok=True)

HEADERS = {
    "Authorization": f"Bearer {NOTION_TOKEN}",
    "Notion-Version": "2022-06-28",
}

# Step 1 產出後填入真實 page_id
PAGES = {
    "2026-05-09-cherry-pick-analysis.md":                     "<page_id_1>",
    "DEV-STATUS.md":                                           "<page_id_2>",
    "upstream-sync-sop-zh-tw.md":                             "<page_id_3>",
    "f1-conversation-search.md":                              "<page_id_4>",
    "f2-artifact-snapshots.md":                               "<page_id_5>",
    "f3-linked-code-folder.md":                               "<page_id_6>",
    "f4-skill-design-system-installer.md":                    "<page_id_7>",
    "f2-f3-f4-execution-plan.md":                             "<page_id_8>",
    "garden-skills-integration-plan.md":                      "<page_id_9>",
    "GPT-IMAGE2-BROWSER-AUTOMATION.md":                       "<page_id_10>",
    "gpt-image2-prompt-gallery.md":                           "<page_id_11>",
    "chatgpt-web-image-generation-opencli-plan.md":           "<page_id_12>",
    "thesys-c1-elevenlabs-integration-plan.md":               "<page_id_13>",
    "Thesys-C1-整合評估-260505.md":                           "<page_id_14>",
    "perplexity-mcp-priority-plan-zh-tw.md":                  "<page_id_15>",
    "perplexity-mcp-tool-schema.md":                          "<page_id_16>",
    "perplexity-mcp-rollout-checklist.md":                    "<page_id_17>",
    "ux-optimization-overview.md":                            "<page_id_18>",
    "open-design-project-editor-ux-plan.md":                  "<page_id_19>",
    "design-system-color-rules-zh-tw.md":                     "<page_id_20>",
    "Prompt-Studio-分類正式資料化與進度文件整合計畫.md":        "<page_id_21>",
}


def fetch_blocks(block_id, depth=0):
    blocks, cursor = [], None
    while True:
        url = f"https://api.notion.com/v1/blocks/{block_id}/children?page_size=100"
        if cursor:
            url += f"&start_cursor={cursor}"
        r = requests.get(url, headers=HEADERS, timeout=30).json()
        for b in r.get("results", []):
            blocks.append(b)
            if b.get("has_children") and depth < 5:
                b["_children"] = fetch_blocks(b["id"], depth + 1)
        if not r.get("has_more"):
            break
        cursor = r["next_cursor"]
    return blocks


def rt(rich):
    out = []
    for t in rich or []:
        s = t.get("plain_text", "")
        a = t.get("annotations", {})
        if a.get("code"):          s = f"`{s}`"
        if a.get("bold"):          s = f"**{s}**"
        if a.get("italic"):        s = f"*{s}*"
        if a.get("strikethrough"): s = f"~~{s}~~"
        if t.get("href"):          s = f"[{s}]({t['href']})"
        out.append(s)
    return "".join(out)


def to_md(blocks, indent=0, _table_row_index=None):
    lines = []
    pad = "  " * indent
    table_row_count = {}  # track row index per table parent

    for i, b in enumerate(blocks):
        t = b["type"]
        d = b[t]

        if t == "paragraph":
            lines.append(f"{pad}{rt(d.get('rich_text'))}")

        elif t.startswith("heading_"):
            n = int(t[-1])
            lines.append(f"{pad}{'#' * n} {rt(d.get('rich_text'))}")

        elif t == "bulleted_list_item":
            lines.append(f"{pad}- {rt(d.get('rich_text'))}")

        elif t == "numbered_list_item":
            lines.append(f"{pad}1. {rt(d.get('rich_text'))}")

        elif t == "to_do":
            chk = "x" if d.get("checked") else " "
            lines.append(f"{pad}- [{chk}] {rt(d.get('rich_text'))}")

        elif t == "quote":
            lines.append(f"{pad}> {rt(d.get('rich_text'))}")

        elif t == "callout":
            icon = (d.get("icon") or {}).get("emoji", "💡")
            lines.append(f"{pad}> {icon} {rt(d.get('rich_text'))}")

        elif t == "code":
            lang = d.get("language", "")
            code_body = rt(d.get("rich_text"))
            lines.append(f"{pad}```{lang}\n{code_body}\n{pad}```")

        elif t == "divider":
            lines.append(f"{pad}---")

        elif t == "toggle":
            lines.append(f"{pad}<details><summary>{rt(d.get('rich_text'))}</summary>\n")

        elif t == "equation":
            lines.append(f"{pad}$$\n{d.get('expression', '')}\n$$")

        elif t == "table":
            pass  # rows 在 children 處理

        elif t == "table_row":
            cells = [rt(c) for c in d.get("cells", [])]
            row_str = f"{pad}| " + " | ".join(cells) + " |"
            lines.append(row_str)
            # 判斷是否為第一行（加 separator）
            if _table_row_index == 0:
                sep = f"{pad}| " + " | ".join(["---"] * len(cells)) + " |"
                lines.append(sep)

        elif t in ("image", "file", "video", "pdf"):
            url = (d.get("file") or d.get("external") or {}).get("url", "")
            lines.append(f"{pad}![{t}]({url})")

        # 處理 children（table_row 傳入 index）
        if b.get("_children"):
            child_blocks = b["_children"]
            if t == "table":
                # 為每個 row 傳入其索引
                child_lines = []
                for row_idx, row_block in enumerate(child_blocks):
                    child_lines += to_md(
                        [row_block], indent=indent + 1, _table_row_index=row_idx
                    ).split("\n")
                lines.extend(child_lines)
            else:
                lines.append(to_md(child_blocks, indent + 1))

    return "\n".join(lines)


def sync_one(fname, pid):
    try:
        meta = requests.get(
            f"https://api.notion.com/v1/pages/{pid}", headers=HEADERS
        ).json()
        title_prop = next(
            (v for v in meta.get("properties", {}).values() if v["type"] == "title"),
            None,
        )
        title = rt(title_prop["title"]) if title_prop else fname[:-3]
        body = to_md(fetch_blocks(pid))
        content = (
            f"---\n"
            f"title: {title}\n"
            f"source: notion\n"
            f"page_id: {pid}\n"
            f"---\n\n"
            f"# {title}\n\n"
            f"{body}\n"
        )
        (OUT_DIR / fname).write_text(content, encoding="utf-8")
        return f"✅ {fname} ({len(content)} chars)"
    except Exception as e:
        return f"❌ {fname}: {e}"


with concurrent.futures.ThreadPoolExecutor(max_workers=8) as ex:
    futures = {ex.submit(sync_one, fname, pid): fname for fname, pid in PAGES.items()}
    for future in concurrent.futures.as_completed(futures):
        print(future.result())

print(f"\n📁 完成 → {OUT_DIR}")
    