---
description: Bidirectionally sync documentation files between local project and Obsidian vault
agent: general
---

Use the `sync_notes` tool to bidirectionally synchronize documentation files. Files matching .withcontextignore patterns will be moved between locations (deleted from source after successful copy).

**Tool Priority:**
First try to use the WithContext plugin's `sync_notes` tool. If not available, fallback to the with-context MCP server's `sync_notes` tool.

**Step 1: Preview what will be synced**
Call sync_notes with dry_run: true to see which files will be moved in each direction.

**Step 2: Perform the sync**
Call sync_notes without dry_run to execute the bidirectional sync.

**Step 3: Report results**
Provide a summary of:

- Total files synced successfully
- Files moved from local to vault (count and list)
- Files moved from vault to local (count and list)
- Files deleted from source (count)
- Any errors or delete failures

**Important:**

- Execute both steps autonomously without asking questions
- Files ARE automatically deleted from source after successful copy
- This is a bidirectional operation - files move in BOTH directions
- Show complete results including what was moved and what was deleted
- Warn the user that source files were deleted (this is expected behavior)

**Sync Behavior:**

- Local files matching patterns → Moved to vault (deleted from local)
- Vault files matching patterns → Moved to local (deleted from vault)
- Only files matching .withcontextignore patterns are synced
- Directory structure is preserved
