---
description: Ingest local documentation files to Obsidian vault
agent: general
---

Use the `ingest_notes` tool to scan the current project for documentation files based on `.withcontextconfig.jsonc` delegation rules and copy them to the Obsidian vault.

**Prerequisites:**

- `.withcontextconfig.jsonc` must exist (run `/setup-notes` first if not)
- Configuration defines which files have delegation decision "vault"

**Tool Priority:**
First try to use the WithContext plugin's `ingest_notes` tool. If not available, fallback to the with-context MCP server's `ingest_notes` tool.

**Step 1: Check for configuration**
The tool will automatically check if `.withcontextconfig.jsonc` exists. If not, it will prompt you to run `/setup-notes` first.

**Step 2: Preview what will be ingested**
Call ingest_notes with dry_run: true to see which files will be moved.

**Step 3: Ingest the files**
Call ingest_notes without dry_run to copy files to vault.

**Step 4: Report results**
Provide a summary of:

- How many files were ingested
- Which files were ingested (list them)
- Any errors or skipped files
- Note that local files were NOT deleted (user can decide on cleanup separately)

**Important:**

- Execute steps autonomously without asking questions - ONLY use the tool calls
- Do NOT delete local files - the main agent will handle cleanup decisions
- Show complete results so the main agent can inform the user
- DO NOT perform any manual file operations - rely entirely on the tool
