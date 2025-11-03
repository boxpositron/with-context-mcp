---
description: Teleport documentation files from Obsidian vault to local project
agent: general
---

Use the with-context MCP server's `teleport_notes` tool to download documentation files from the Obsidian vault back to the local project.

**Step 1: Preview what will be teleported**
Call teleport_notes with dry_run: true to see which files will be downloaded.

**Step 2: Teleport the files**
Call teleport_notes without dry_run to download files from vault.

**Step 3: Report results**
Provide a summary of:

- How many files were teleported
- Which files were teleported (list them)
- Where they were placed in the local project (show directory structure)
- Any errors or skipped files
- Note that vault files were NOT deleted (user can decide on cleanup separately)

**Important:**

- Execute both steps autonomously without asking questions
- Do NOT delete vault files - the main agent will handle cleanup decisions
- Show complete results so the main agent can inform the user
- Files will maintain their directory structure in the local project
