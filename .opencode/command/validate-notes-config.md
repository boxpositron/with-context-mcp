---
description: Validate .withcontextconfig.jsonc for errors and warnings
agent: general
subtask: true
---

# Validate Notes Configuration

Validates the `.withcontextconfig.jsonc` file for syntax errors, structural issues, and provides detailed feedback on configuration problems.

## What This Command Does

This command performs comprehensive validation of your documentation delegation configuration:

**Validation Checks:**

1. **File Existence** - Verifies `.withcontextconfig.jsonc` exists
2. **Syntax Validation** - Checks for valid JSON/JSONC syntax
3. **Schema Validation** - Validates against the configuration schema
4. **Semantic Validation** - Checks for logical issues:
   - Pattern conflicts between `vault` and `local` arrays
   - Invalid glob patterns
   - Missing required fields
   - Deprecated or unknown configuration options
5. **Best Practices** - Provides recommendations and warnings

**Prerequisites:**

- `.withcontextconfig.jsonc` must exist (run `/setup-notes` first if not)

**Tool Priority:**
First try to use the WithContext plugin's `validate_config` tool. If not available, fallback to the with-context MCP server's `validate_config` tool.

## Your Task

Execute the validate_config tool immediately:

```javascript
const result = await validate_config({
  project_root: process.cwd(),
});

return result;
```

The tool output includes:

- Configuration path and validation status
- All errors (critical issues that must be fixed)
- All warnings (non-critical issues to address)
- Info messages (helpful suggestions)
- Suggested next steps

## Example Output

```
=== Configuration Validation ===

Configuration: /path/to/project/.withcontextconfig.jsonc
Status: ✓ Valid

Warnings (2):
  • Pattern 'docs/**/*.md' in vault array may conflict with 'docs/internal/**' in local array
    Resolution: 'local-wins' strategy will prioritize local patterns
  • Consider adding more specific patterns for better control

Info (1):
  • Configuration follows v2.1 format
  • Using recommended 'local-wins' conflict resolution

Next Steps:
  1. Review pattern conflicts highlighted above
  2. Run /preview-notes-delegation to see how files will be categorized
  3. Use /sync-notes when ready to synchronize files
```

## Important

- **Execute autonomously** - Do NOT ask questions, just call the tool and report results
- **Trust the tool output** - The validator has comprehensive checks built-in
- **Show full validation report** - Include all errors, warnings, and info messages
- **Provide context** - Explain what each issue means and how to fix it
- **DO NOT manually parse** the config file - rely entirely on the tool

## Common Validation Issues

**Syntax Errors:**

- Missing commas, quotes, or brackets
- Invalid JSONC comments
- Trailing commas in wrong places

**Schema Errors:**

- Missing `version` field
- Invalid `defaultBehavior` value (must be "local" or "vault")
- Invalid `conflictResolution` value

**Semantic Errors:**

- Overlapping patterns in `vault` and `local` arrays
- Invalid glob patterns
- Patterns that will never match any files

## Related Commands

- `/setup-notes` - Create or regenerate configuration
- `/preview-notes-delegation` - Preview delegation decisions
- `/sync-notes` - Synchronize files based on validated configuration

---

_The validate-notes-config command ensures your configuration is correct before performing sync operations._
