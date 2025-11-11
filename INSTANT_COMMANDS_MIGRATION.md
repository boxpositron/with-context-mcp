# Instant Commands Migration Summary

## Overview

All OpenCode commands have been migrated from multi-step AI-interpreted workflows to **instant execution** patterns that run immediately like the built-in `/init` command.

## What Changed

### Before (Multi-Step Pattern)

Commands contained AI-driven workflows with explicit phases:

```javascript
// Step 1: Preview (dry_run: true)
const preview = await tool({ dry_run: true });
return preview; // STOP HERE - wait for user

// Step 2: Execute (separate invocation)
const result = await tool({ dry_run: false });
return result;
```

**Problems:**

- Required AI interpretation ("Display preview and STOP")
- Not truly instant - AI must decide what phase to run
- Multiple tool invocations needed
- Confusing user experience

### After (Instant Pattern)

Commands execute immediately using `$ARGUMENTS` for flags:

```javascript
// Check for --execute flag
const shouldExecute = '$ARGUMENTS'.includes('--execute');

const result = await tool({
  dry_run: !shouldExecute,
});

return result;
```

**Benefits:**

- Single tool call per invocation
- Zero AI interpretation needed
- True instant execution
- Safe by default (dry-run)
- Familiar CLI pattern

## Updated Commands

### 1. Read-Only Commands (Always Instant)

#### `/validate-notes-config`

- **Before:** Multi-step instructions with manual validation steps
- **After:** Single tool call, instant validation
- **Usage:** `/validate-notes-config`

#### `/preview-notes-delegation`

- **Before:** Multi-step with optional parameters needing AI decisions
- **After:** Instant with argument-based flags
- **Usage:**
  - `/preview-notes-delegation` - Full preview
  - `/preview-notes-delegation --vault-only` - Show only vault files
  - `/preview-notes-delegation --limit 20` - Limit results

#### `/analyze-vault`

- **Before:** Multi-step instructions
- **After:** Instant with argument-based options
- **Usage:**
  - `/analyze-vault` - Full analysis
  - `/analyze-vault --no-categories` - Skip categorization
  - `/analyze-vault --max-files 500` - Limit files

### 2. Setup Command

#### `/setup-notes`

- **Before:** Required AI to set parameters
- **After:** Instant with sensible defaults from arguments
- **Usage:**
  - `/setup-notes` - Full setup with vault folders
  - `/setup-notes --no-structure` - Skip folder creation
  - `/setup-notes --force` - Overwrite existing config

### 3. Sync Commands (Destructive - Safe by Default)

#### `/sync-notes`

- **Before:** Two-phase preview → execute pattern
- **After:** Instant dry-run, requires `--execute` flag
- **Usage:**
  - `/sync-notes` - Preview (safe, dry-run)
  - `/sync-notes --execute` - Execute sync

#### `/ingest-notes`

- **Before:** Two-phase with optional delete parameter
- **After:** Instant with multiple flags
- **Usage:**
  - `/ingest-notes` - Preview
  - `/ingest-notes --execute` - Copy to vault
  - `/ingest-notes --execute --delete` - Copy and delete local

#### `/teleport-notes`

- **Before:** Two-phase with optional delete parameter
- **After:** Instant with multiple flags
- **Usage:**
  - `/teleport-notes` - Preview
  - `/teleport-notes --execute` - Download from vault
  - `/teleport-notes --execute --delete` - Download and delete from vault

### 4. Complex Command

#### `/reorganize-notes`

- **Before:** Required separate plan generation, preview, and execution
- **After:** Instant plan generation + execution with presets
- **Usage:**
  - `/reorganize-notes` - Preview with 'clean' preset
  - `/reorganize-notes --execute` - Execute with 'clean' preset
  - `/reorganize-notes --preset minimal` - Use different preset
  - `/reorganize-notes --min-confidence 0.9` - Higher confidence

## Pattern Details

### Argument Parsing Pattern

All commands use this pattern to parse `$ARGUMENTS`:

```javascript
const args = '$ARGUMENTS';
const shouldExecute = args.includes('--execute');
const flagValue = args.match(/--flag[=\s](\w+)/);
```

### Safety Defaults

**Destructive operations default to dry-run:**

- `/sync-notes` → dry-run (preview only)
- `/ingest-notes` → dry-run (preview only)
- `/teleport-notes` → dry-run (preview only)
- `/reorganize-notes` → dry-run (preview only)

**Require explicit `--execute` flag to make changes.**

### Common Flags

- `--execute` - Execute for real (vs dry-run preview)
- `--delete` - Delete source files (ingest/teleport)
- `--force` - Force operation (setup)
- `--force-delete` - Force delete even on errors
- `--preset [name]` - Use specific preset (reorganize)
- `--min-confidence [0.0-1.0]` - Confidence threshold
- `--limit [N]` - Limit results
- `--vault-only` - Show only vault files
- `--local-only` - Show only local files
- `--no-reasoning` - Hide detailed reasoning
- `--no-categories` - Skip categorization
- `--no-orphans` - Skip orphan detection
- `--no-structure` - Skip folder creation

## Migration Benefits

### For Users

1. **Faster execution** - No AI interpretation delay
2. **Predictable behavior** - Same command always does same thing
3. **Familiar pattern** - Standard CLI flag usage
4. **Safe defaults** - Preview before execution
5. **Clear intent** - Flags show exactly what will happen

### For Developers

1. **Maintainable** - Simple, direct tool calls
2. **Testable** - Deterministic behavior
3. **Debuggable** - No complex AI decision trees
4. **Extensible** - Easy to add new flags

## Breaking Changes

**None.** All commands maintain backward compatibility:

- Old invocations without flags still work (use safe defaults)
- New flags are optional enhancements
- AI can still understand natural language requests and convert to flags

## Testing

Test each command:

```bash
# Read-only (should be instant)
/validate-notes-config
/preview-notes-delegation
/analyze-vault

# Setup (instant with defaults)
/setup-notes

# Sync commands (preview by default)
/sync-notes
/sync-notes --execute

/ingest-notes
/ingest-notes --execute

/teleport-notes
/teleport-notes --execute

# Complex command
/reorganize-notes
/reorganize-notes --execute
```

## Performance Comparison

### Before (Multi-Step)

1. User runs command
2. AI interprets workflow phase
3. AI decides on tool parameters
4. Tool executes
5. AI formats output
6. **User must run again for next phase**

**Total time:** 2-5 seconds per phase × 2+ phases = 4-10+ seconds

### After (Instant)

1. User runs command with flags
2. Tool executes immediately
3. Output returned

**Total time:** < 1 second

## Future Enhancements

Potential improvements:

1. **Interactive mode** - Prompt for flags if not provided
2. **Config presets** - Save common flag combinations
3. **Batch operations** - Run multiple commands in sequence
4. **Progress indicators** - Show real-time progress for long operations

## Documentation Updates

Updated files:

- `.opencode/command/validate-notes-config.md`
- `.opencode/command/preview-notes-delegation.md`
- `.opencode/command/analyze-vault.md`
- `.opencode/command/setup-notes.md`
- `.opencode/command/sync-notes.md`
- `.opencode/command/ingest-notes.md`
- `.opencode/command/teleport-notes.md`
- `.opencode/command/reorganize-notes.md`

## Related Documentation

- [OpenCode Commands Documentation](https://opencode.ai/docs/commands)
- [Vault Organization Guide](./docs/VAULT_ORGANIZATION.md)
- [Vault Presets](./docs/VAULT_PRESETS.md)

---

**Migration completed:** All commands now run instantly like `/init`
