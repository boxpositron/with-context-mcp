---
description: Preview which documentation files will be delegated to vault vs local
agent: general
subtask: true
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

Execute the preview_delegation tool immediately with options based on user arguments:

```javascript
// Parse optional arguments
const args = '$ARGUMENTS';
const vaultOnly = args.includes('--vault-only');
const localOnly = args.includes('--local-only');
const noReasoning = args.includes('--no-reasoning');
const limitMatch = args.match(/--limit[=\s](\d+)/);
const limit = limitMatch ? parseInt(limitMatch[1]) : 100;

const result = await preview_delegation({
  project_root: process.cwd(),
  show_reasoning: !noReasoning,
  limit: limit,
  vault_only: vaultOnly,
  local_only: localOnly,
});

return result;
```

**Usage Examples:**

- `/preview-notes-delegation` - Full preview with reasoning
- `/preview-notes-delegation --vault-only` - Show only vault files
- `/preview-notes-delegation --local-only` - Show only local files
- `/preview-notes-delegation --limit 20` - Limit to 20 files per category
- `/preview-notes-delegation --no-reasoning` - Hide detailed reasoning

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
