---
description: Teleport documentation files from Obsidian vault to local project
agent: general
---

Use the `teleport_notes` tool to download documentation files from the Obsidian vault back to the local project based on `.withcontextconfig.jsonc` delegation rules.

**Prerequisites:**

- `.withcontextconfig.jsonc` must exist (run `/setup-notes` first if not)
- Configuration defines which files have delegation decision "vault"

**Tool Priority:**
First try to use the WithContext plugin's `teleport_notes` tool. If not available, fallback to the with-context MCP server's `teleport_notes` tool.

**Step 1: Check for configuration**
The tool will automatically check if `.withcontextconfig.jsonc` exists. If not, it will prompt you to run `/setup-notes` first.

**Step 2: Preview what will be teleported**
Call teleport_notes with dry_run: true to see which files will be downloaded.

**Step 3: Teleport the files**
Call teleport_notes without dry_run to download files from vault.

**Step 4: Report results**
Provide a summary of:

- How many files were teleported
- Which files were teleported (list them)
- Where they were placed in the local project (show directory structure)
- Any errors or skipped files
- Note that vault files were NOT deleted (user can decide on cleanup separately)

**Important:**

- Execute steps autonomously without asking questions - ONLY use the tool calls
- Do NOT delete vault files - the main agent will handle cleanup decisions
- Show complete results so the main agent can inform the user
- Files will maintain their directory structure in the local project
- DO NOT perform any manual file operations - rely entirely on the tool
