---
description: Ingest local documentation files to Obsidian vault
agent: general
---

# Ingest Notes

Scans the current project for documentation files based on `.withcontextconfig.jsonc` delegation rules and copies them to the Obsidian vault.

## What This Command Does

This command copies documentation files from your local project to the Obsidian vault:

- Scans project for files matching vault patterns in `.withcontextconfig.jsonc`
- Copies matched files to vault preserving directory structure
- Optionally deletes local files after successful copy
- Provides dry-run preview mode

**Prerequisites:**

- `.withcontextconfig.jsonc` must exist (run `/setup-notes` first if not)
- Configuration defines which files have delegation decision "vault"

## Your Task

When this command is run:

**CRITICAL: Use ONLY the ingest_notes tool. Do NOT perform any manual operations.**

1. **Call the ingest_notes tool** with appropriate parameters:
   - The tool handles ALL file scanning and copying automatically
   - Use `dry_run: true` first to preview what will be ingested
   - After user confirms, call with `dry_run: false` to execute
   - Use `delete_local_files: true` to clean up after ingestion (optional)

2. **Report the results** from the tool:
   - Show how many files were ingested
   - List which files were ingested
   - Show any errors or skipped files
   - Note whether local files were deleted

3. **Do NOT manually**:
   - Read or scan directories for documentation files
   - Copy files between locations
   - Delete local files
   - Parse `.withcontextconfig.jsonc`
   - The ingest_notes tool does ALL of this automatically

**Tool Priority:**
First try to use the WithContext plugin's `ingest_notes` tool. If not available, fallback to the with-context MCP server's `ingest_notes` tool.

**Example usage:**

```javascript
// Preview what will be ingested (always do this first!)
ingest_notes({
  project_folder: 'my-project',
  dry_run: true,
});

// Execute ingestion after user confirms (do NOT delete local files by default)
ingest_notes({
  project_folder: 'my-project',
  dry_run: false,
  delete_local_files: false, // Keep local files (default)
});

// Execute with cleanup (only if user explicitly requests)
ingest_notes({
  project_folder: 'my-project',
  dry_run: false,
  delete_local_files: true, // Delete local files after successful copy
  force_delete: true, // Force deletion even if some files had errors
});
```

## Parameters

### dry_run (optional, default: false)

Preview mode - shows what will happen without making changes:

```javascript
dry_run: true; // Preview only
dry_run: false; // Execute for real
```

### delete_local_files (optional, default: false)

Whether to delete local files after successful copy to vault:

```javascript
delete_local_files: false; // Keep local files (default)
delete_local_files: true; // Delete local files after copy
```

### force_delete (optional, default: false)

Force deletion of local files even if some files had errors:

```javascript
force_delete: false; // Don't delete if errors occurred (default)
force_delete: true; // Delete even if some files failed
```

## Important Notes

- **Local files are NOT deleted by default** - set `delete_local_files: true` explicitly if desired
- **Always preview first** - Use `dry_run: true` before executing
- **The tool automatically checks** for `.withcontextconfig.jsonc` existence
- **Directory structure is preserved** in the vault

## Related Commands

- `/setup-notes` - Create configuration file
- `/preview-notes-delegation` - Preview which files will be ingested
- `/sync-notes` - Bidirectional sync (moves files both ways)
- `/validate-notes-config` - Validate configuration

---

_The ingest-notes tool copies local documentation to vault based on delegation rules._
