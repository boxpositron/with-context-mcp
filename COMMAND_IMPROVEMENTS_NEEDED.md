# OpenCode Command Improvements Needed

## Summary

The commands in `.opencode/command/` are mostly correct but need refinements to eliminate AI interpretation and ensure direct tool usage.

## Key Issues

### 1. Remove Optional Health Checks

Commands have "Step 0: Health Check (Optional)" that asks AI to interpret results.
**Fix**: Remove these sections - tools should handle health checks internally.

### 2. Clarify Confirmation Workflows

Commands say "get user confirmation" without specifying HOW.
**Fix**: Use two-step command pattern (preview vs execute) instead of interactive prompts.

### 3. Update Tool Examples

Examples still show `project_folder` parameter that was removed.
**Fix**: Remove project_folder from all non-session tool examples.

## Files Needing Updates

- `.opencode/command/analyze-vault.md`
- `.opencode/command/reorganize-notes.md`
- `.opencode/command/setup-notes.md`
- `.opencode/command/sync-notes.md`
- `.opencode/command/ingest-notes.md`
- `.opencode/command/teleport-notes.md`
- `.opencode/command/preview-notes-delegation.md`
- `.opencode/command/validate-notes-config.md`

## Priority

**High**: Update reorganize-notes (destructive operations)
**Medium**: Remove project_folder from examples
**Low**: Standardize formatting
