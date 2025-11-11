---
description: Preview which documentation files will be delegated to vault vs local
agent: general
subtask: false
---

# Preview Notes Delegation

Previews which files in your project will be delegated to the Obsidian vault versus kept in the local repository based on `.withcontextconfig.jsonc` patterns.

## What This Command Does

This command analyzes your project files and shows delegation decisions **before** performing any sync operations:

**Analysis Features:**

1. **File Discovery** - Scans project for documentation files matching patterns
2. **Delegation Decision** - Applies configuration rules to determine vault vs local
3. **Categorization** - Groups files by destination (vault/local)
4. **Reasoning** - Optionally shows why each file was categorized
5. **Filtering** - Can show only vault files or only local files

**Prerequisites:**

- `.withcontextconfig.jsonc` must exist (run `/setup-notes` first if not)

**Tool Priority:**
First try to use the WithContext plugin's `preview_delegation` tool. If not available, fallback to the with-context MCP server's `preview_delegation` tool.

## Your Task

When this command is run:

**Step 1: Call the preview_delegation tool**

**CRITICAL: Use ONLY the preview_delegation tool. Do NOT perform any manual operations.**

**Call the preview_delegation tool** with appropriate parameters:

- The tool handles ALL file scanning and delegation decisions automatically
- Use `show_reasoning: true` to see why each file was categorized
- Use `limit` to control how many files are shown per category
- Use `vault_only` or `local_only` to filter results

**Step 2: Present the preview** from the tool:

- Show summary statistics (total files, vault count, local count)
- List vault files (files that will be delegated to vault)
- List local files (files that will stay in repository)
- Show reasoning if requested

**Step 3: Suggest next steps** based on preview results:

- If patterns look correct: Suggest running `/sync-notes` or `/ingest-notes`
- If patterns need adjustment: Suggest editing `.withcontextconfig.jsonc`
- If conflicts detected: Suggest running `/validate-notes-config`

**Step 4: Do NOT manually**:

- Read or scan directories for documentation files
- Determine delegation decisions
- Parse `.withcontextconfig.jsonc`
- Categorize files
- The preview_delegation tool does ALL of this automatically

**Example usage:**

```javascript
// Basic preview
preview_delegation({
  project_root: '/path/to/project', // Use current working directory
  show_reasoning: true, // Show why each file was categorized
  limit: 50, // Show up to 50 files per category
});
```

## Optional Parameters

The user can customize the preview with flags:

**`--vault-only`** - Show only files going to vault

```javascript
preview_delegation({
  project_root: '/path/to/project',
  vault_only: true,
});
```

**`--local-only`** - Show only files staying local

```javascript
preview_delegation({
  project_root: '/path/to/project',
  local_only: true,
});
```

**`--limit N`** - Limit results per category (default: 100)

```javascript
preview_delegation({
  project_root: '/path/to/project',
  limit: 20,
});
```

**`--no-reasoning`** - Hide reasoning details

```javascript
preview_delegation({
  project_root: '/path/to/project',
  show_reasoning: false,
});
```

## Example Output

```
================================================================================
DELEGATION PREVIEW
================================================================================

Configuration: /path/to/project/.withcontextconfig.jsonc
Total files: 23
  • Vault: 15
  • Local: 8

--------------------------------------------------------------------------------
FILES TO DELEGATE TO VAULT (15 total, showing 15)
--------------------------------------------------------------------------------

  → docs/guides/getting-started.md
     Reason: Matches vault pattern 'docs/guides/**'
  → docs/tutorials/installation.md
     Reason: Matches vault pattern 'docs/tutorials/**'
  → CHANGELOG.md
     Reason: Matches vault pattern 'CHANGELOG.md'
  → docs/architecture/decisions/001-use-typescript.md
     Reason: Matches vault pattern 'docs/architecture/**'

  ... and 11 more files

--------------------------------------------------------------------------------
FILES TO KEEP LOCAL (8 total, showing 8)
--------------------------------------------------------------------------------

  [OK] README.md
     Reason: Matches local pattern 'README.md'
  [OK] CONTRIBUTING.md
     Reason: Matches local pattern 'CONTRIBUTING.md'
  [OK] src/utils/README.md
     Reason: Matches local pattern 'src/**/*.md'
  [OK] tests/fixtures/sample.md
     Reason: Matches local pattern 'tests/**/*.md'

  ... and 4 more files

================================================================================
```

## Important

- **Execute autonomously** - Parse user flags and call the tool with correct parameters
- **No file modifications** - This is a preview-only command (safe to run anytime)
- **Trust the tool output** - Delegation logic is comprehensive
- **Show full preview** - Don't truncate unless using --limit flag
- **DO NOT manually scan** directories - rely entirely on the tool

## Use Cases

**Before first sync:**

```
/preview-notes-delegation
```

Verify patterns work as expected before moving files.

**Testing new patterns:**
After editing `.withcontextconfig.jsonc`, preview to verify changes.

**Debugging delegation:**

```
/preview-notes-delegation --vault-only
```

See only files that will be moved to vault.

**Quick summary:**

```
/preview-notes-delegation --limit 10 --no-reasoning
```

Get a quick overview without detailed reasoning.

## Related Commands

- `/validate-notes-config` - Validate configuration before previewing
- `/setup-notes` - Create or regenerate configuration
- `/sync-notes` - Perform actual synchronization after previewing
- `/ingest-notes` - Move files to vault after previewing

---

_The preview-notes-delegation command helps you test and verify delegation patterns before making any file changes._
