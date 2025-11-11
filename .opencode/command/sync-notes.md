---
description: Bidirectionally sync documentation files between local project and Obsidian vault
agent: general
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

**Step 0: Health Check (Optional but Recommended)**

Before executing the main task, run a quick health check to ensure everything is configured correctly:

```javascript
const health = await health_check({});

// If there are issues, show them to the user
if (health.status !== 'healthy') {
  console.log('⚠️  Configuration Issues Detected:');
  console.log(JSON.stringify(health, null, 2));
  console.log('\nRecommendations:');
  health.recommendations.forEach((rec) => console.log(`  - ${rec}`));
  console.log('\n❓ Would you like to continue anyway? (Issues may cause failures)');
  // Wait for user confirmation before proceeding
}
```

**What the health check validates:**

- Environment variables (OBSIDIAN_API_URL, OBSIDIAN_API_KEY, OBSIDIAN_VAULT)
- Obsidian API connection and authentication
- Vault accessibility
- Configuration file validity (if exists)

**If health check fails, common fixes:**

- Set missing environment variables
- Check Obsidian Local REST API is running
- Verify vault name matches exactly
- Confirm API key is correct

---

**Step 1: Call the sync_notes tool**

**CRITICAL: Use ONLY the sync_notes tool. Do NOT perform any manual operations.**

**Call the sync_notes tool** with appropriate parameters:

- The tool handles ALL file scanning, moving, and deletion automatically
- Use `dry_run: true` first to preview what will be synced
- After user confirms, call with `dry_run: false` to execute
- The tool automatically deletes source files after successful copy

**Step 2: Report the results** from the tool:

- Show total files synced successfully
- List files moved from local to vault
- List files moved from vault to local
- Show how many files were deleted from source
- Report any errors or delete failures
- Warn user that source files were deleted (this is expected behavior)

**Step 3: Do NOT manually**:

- Read or scan directories for documentation files
- Copy or move files between locations
- Delete files from source
- Parse `.withcontextconfig.jsonc`
- The sync_notes tool does ALL of this automatically

**Tool Priority:**
First try to use the WithContext plugin's `sync_notes` tool. If not available, fallback to the with-context MCP server's `sync_notes` tool.

**Example usage:**

```javascript
// Preview what will be synced (always do this first!)
sync_notes({
  project_folder: 'my-project',
  dry_run: true,
});

// Execute sync after user confirms
sync_notes({
  project_folder: 'my-project',
  dry_run: false,
});
```

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
