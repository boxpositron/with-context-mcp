---
description: Bidirectionally sync documentation files between local project and Obsidian vault
agent: general
subtask: false
---

# Sync Notes

Bidirectionally synchronizes documentation files between local project and Obsidian vault. Files are moved based on delegation rules (deleted from source after successful copy).

## What This Command Does

This command performs bidirectional synchronization:

- **Local → Vault**: Files matching "vault" patterns are moved from local to vault
- **Vault → Local**: Files matching "local" patterns are moved from vault to local
- **Move operation**: Files are DELETED from source after successful copy
- **Structure preserved**: Directory structure is maintained in both directions
- **Dry-run preview**: See what will happen before executing

**Prerequisites:**

- `.withcontextconfig.jsonc` must exist (run `/setup-notes` first if not)
- Configuration defines which files are delegated to vault vs local

## Your Task

When this command is run:

**Step 1: Call the sync_notes tool**

**CRITICAL: Use ONLY the sync_notes tool. Do NOT perform any manual operations.**

Call the `sync_notes` tool directly. The tool will:

- Auto-detect project from git context
- Scan for files matching .withcontextconfig.jsonc patterns
- Move files bidirectionally (vault ↔ local)
- Delete source files after successful copy
- Return formatted results

```javascript
// Preview first (recommended)
const preview = await sync_notes({
  dry_run: true, // Preview only
});

// Display preview and STOP - user must run execute separately
return preview;

// Execute (separate command invocation)
const result = await sync_notes({
  dry_run: false, // Execute for real
});

// Display results
return result;
```

**Step 2: Do NOT manually**:

- Scan directories or read files
- Move or copy files between locations
- Delete source files
- Parse configuration
- Interpret or format results
- The tool handles ALL of this automatically

## Parameters

### dry_run (optional, default: false)

Preview mode - shows what will happen without making changes:

```javascript
dry_run: true; // Preview only
dry_run: false; // Execute for real
```

## Sync Behavior

**Files with delegation decision "vault":**

- Moved from local → vault
- Deleted from local after successful copy

**Files with delegation decision "local":**

- Moved from vault → local
- Deleted from vault after successful copy

**Important notes:**

- Only files matching `.withcontextconfig.jsonc` patterns are synced
- Directory structure is preserved in both locations
- Files are DELETED from source automatically (this is a MOVE operation, not COPY)
- The tool checks for configuration existence automatically

## Example Output

```
=== Sync Results ===

Files moved from local to vault: 12
  - docs/guides/getting-started.md
  - docs/architecture/decisions/001-use-typescript.md
  - CHANGELOG.md
  ... (9 more files)

Files moved from vault to local: 3
  - README.md
  - CONTRIBUTING.md
  - src/utils/README.md

Total files deleted from source: 15
Errors: 0

⚠️ Source files were deleted after successful copy (expected behavior)
```

## Related Commands

- `/setup-notes` - Create configuration file
- `/preview-notes-delegation` - Preview sync decisions
- `/ingest-notes` - One-way copy to vault (keeps local files)
- `/teleport-notes` - One-way download from vault (keeps vault files)
- `/validate-notes-config` - Validate configuration

---

_The sync-notes tool performs bidirectional synchronization with automatic source deletion._
