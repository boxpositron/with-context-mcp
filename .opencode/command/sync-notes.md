---
description: Bidirectionally sync documentation files between local project and Obsidian vault
agent: general
---

Use the `sync_notes` tool to bidirectionally synchronize documentation files. Files are synced based on delegation rules configured in `.withcontextconfig.jsonc` and moved between locations (deleted from source after successful copy).

**Prerequisites:**

- `.withcontextconfig.jsonc` must exist (run `/setup-notes` first if not)
- Configuration defines which files are delegated to vault vs local

**Tool Priority:**
First try to use the WithContext plugin's `sync_notes` tool. If not available, fallback to the with-context MCP server's `sync_notes` tool.

**Step 1: Check for configuration**
The tool will automatically check if `.withcontextconfig.jsonc` exists. If not, it will prompt you to run `/setup-notes` first.

**Step 2: Preview what will be synced**
Call sync_notes with dry_run: true to see which files will be moved in each direction.

**Step 3: Perform the sync**
Call sync_notes without dry_run to execute the bidirectional sync.

**Step 4: Report results**
Provide a summary of:

- Total files synced successfully
- Files moved from local to vault (count and list)
- Files moved from vault to local (count and list)
- Files deleted from source (count)
- Any errors or delete failures

**Important:**

- Execute steps autonomously without asking questions - ONLY use the tool calls
- Files ARE automatically deleted from source after successful copy
- This is a bidirectional operation - files move in BOTH directions
- Show complete results including what was moved and what was deleted
- Warn the user that source files were deleted (this is expected behavior)
- DO NOT perform any manual file operations - rely entirely on the tool

**Sync Behavior:**

- Files with delegation decision "vault" → Moved from local to vault (deleted from local)
- Files with delegation decision "local" → Moved from vault to local (deleted from vault)
- Only files matching `.withcontextconfig.jsonc` patterns are synced
- Directory structure is preserved
