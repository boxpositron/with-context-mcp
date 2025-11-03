---
description: Ingest local documentation files to Obsidian vault
agent: general
---

Use the `ingest_notes` tool to scan the current project for documentation files that match .withcontextignore patterns and copy them to the Obsidian vault.

**Tool Priority:**
First try to use the WithContext plugin's `ingest_notes` tool. If not available, fallback to the with-context MCP server's `ingest_notes` tool.

**Step 1: Preview what will be ingested**
Call ingest_notes with dry_run: true to see which files will be moved.

**Step 2: Ingest the files**
Call ingest_notes without dry_run to copy files to vault.

**Step 3: Report results**
Provide a summary of:

- How many files were ingested
- Which files were ingested (list them)
- Any errors or skipped files
- Note that local files were NOT deleted (user can decide on cleanup separately)

**Important:**

- Execute both steps autonomously without asking questions
- Do NOT delete local files - the main agent will handle cleanup decisions
- Show complete results so the main agent can inform the user
