# Notion CLI Guide for AI Agents

## Overview

The notion CLI in opencli provides a programmatic interface to interact with Notion pages. This guide explains how Claude (as an AI agent) can use these commands effectively.

## Prerequisites

- opencli installed and configured
- Notion authentication configured (via browser context in opencli)
- Access to a Notion workspace

## Command Reference

### 1. notion export

Exports the currently active Notion page as Markdown.

**Usage:**

```bash
opencli notion export [--output <path>]
```

**Output:** Saves Markdown file to specified path (default: `/tmp/notion-export.md`)

**Use cases:**

- Backup Notion pages
- Convert pages to static formats
- Extract page content for processing

---

### 2. notion read

Reads the content of the current Notion page.

**Usage:**

```bash
opencli notion read [--last <num>]
```

**Output:** Returns page content as structured text

**Use cases:**

- Retrieve page content for analysis
- Extract specific sections
- Monitor page updates

---

### 3. notion write

Writes or updates content on the current Notion page.

**Usage:**

```bash
opencli notion write <content> [--mode append|replace]
```

**Output:** Confirmation of write operation

**Use cases:**

- Add notes to Notion
- Update page content programmatically
- Automate content creation

---

### 4. notion search

Searches the Notion workspace for pages matching criteria.

**Usage:**

```bash
opencli notion search <query> [--filter type:page] [--limit 10]
```

**Output:** List of matching pages with metadata

**Use cases:**

- Find relevant pages
- Discover documentation
- Locate project pages

---

### 5. notion favorites

Manages Notion favorites list.

**Usage:**

```bash
opencli notion favorites [--add <page_id>] [--remove <page_id>] [--list]
```

**Output:** Confirmation or list of favorites

**Use cases:**

- Organize frequently accessed pages
- Maintain a reading list
- Pin important projects

---

### 6. notion sidebar

Accesses Notion sidebar navigation.

**Usage:**

```bash
opencli notion sidebar [--list] [--collapse <name>] [--expand <name>]
```

**Output:** Sidebar structure or action confirmation

**Use cases:**

- Navigate workspace structure
- Organize sidebar
- Access nested sections

---

### 7. notion status

Gets the status of the current Notion page.

**Usage:**

```bash
opencli notion status
```

**Output:** Page metadata (title, created date, last edited, etc.)

**Use cases:**

- Check page properties
- Verify page accessibility
- Monitor page changes

---

### 8. notion new

Creates a new Notion page.

**Usage:**

```bash
opencli notion new [--title <title>] [--parent <page_id>] [--template <template>]
```

**Output:** New page ID and URL

**Use cases:**

- Automate page creation
- Generate project pages
- Create templated content

---

## Best Practices

### 1. Error Handling

Always wrap commands in try-catch when executing via Bash:

```bash
opencli notion read || echo "Failed to read page"
```

### 2. Argument Validation

Validate user input before passing to commands:

- Sanitize file paths for export
- Escape special characters in search queries
- Validate page IDs before operations

### 3. Performance Considerations

- Use `--limit` flag for search to avoid large result sets
- Export only necessary pages to avoid I/O overhead
- Cache page content when repeated access is expected

### 4. Security

- Never log sensitive page content
- Validate Notion authentication before operations
- Sanitize output before displaying to users

## Workflow Example: Page Processing Pipeline

```bash
# 1. Search for pages matching criteria
PAGES=$(opencli notion search "project status")

# 2. For each page, read its content
# (Note: This would require additional parsing)

# 3. Export the page
opencli notion export --output ~/exports/project-status.md

# 4. Process the exported file
cat ~/exports/project-status.md | wc -l
```

## Common Issues and Solutions

### Issue: "Notion page not accessible"

**Cause:** Browser context not initialized or Notion tab not active
**Solution:** Ensure Notion is open in the browser before running commands

### Issue: "Export file permission denied"

**Cause:** Output directory not writable
**Solution:** Check directory permissions or specify a different output path

### Issue: "Search returns no results"

**Cause:** Query too specific or pages don't exist
**Solution:** Try broader search terms or verify page titles

## Integration with Claude Workflows

When Claude uses this skill:

1. **Analyze user request** → Determine which notion command to use
2. **Validate prerequisites** → Check Notion is accessible
3. **Execute command** → Run via `opencli notion <cmd>`
4. **Parse output** → Extract meaningful data from results
5. **Format response** → Present results in user-friendly format
6. **Handle errors** → Provide clear error messages if operation fails
