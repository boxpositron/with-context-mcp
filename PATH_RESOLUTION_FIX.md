# Path Resolution Fix

## Problem

Files were being created with nested folder structure instead of at vault root:

```
Before:
├── Users
│   └── davidibia
│       ├── dotfiles
│       │   └── README.md
│       └── Projects
│           └── MCP
│               └── with-context-mcp
│                   ├── release-notes-v3.0.0.md
│                   ├── release-notes-v3.0.1.md
│                   └── release-notes-v3.0.2.md
└── with-context-mcp
```

When creating a note like `release-notes.md`, the system was constructing paths as:

- `Projects/with-context-mcp/release-notes.md`

This created unwanted nested folders in the Obsidian vault.

## Root Cause

The `sanitizePath` function (src/security/path-validator.ts:85-89) was constructing vault paths by concatenating:

```typescript
const vaultRelativePath = [basePath, projectFolder, cleanPath].filter(Boolean).join('/');
```

This resulted in paths like `Projects/with-context-mcp/note.md` instead of just `note.md`.

## Solution

Modified `sanitizePath` to return the clean path directly without prepending basePath/projectFolder:

```typescript
// Construct the vault-relative path: just use cleanPath (vault root level)
// Files are created at the vault root, not nested under basePath/projectFolder
const vaultRelativePath = cleanPath;
```

## Changes Made

### 1. src/security/path-validator.ts

- Line 85-89: Removed basePath/projectFolder concatenation
- Line 3-11: Updated JSDoc to reflect new behavior

### 2. tests/unit/path-validator.test.ts

- Updated all test expectations to expect vault root paths
- Added comments explaining the new behavior

## Behavior After Fix

When you call `write_note(path="release-notes.md")`:

- Path is sanitized to: `release-notes.md`
- File is created at: `/vault_root/release-notes.md`

When you call `write_note(path="docs/api.md")`:

- Path is sanitized to: `docs/api.md`
- File is created at: `/vault_root/docs/api.md`

## Impact

✅ All 180 tests pass
✅ Build successful
✅ Files now created at vault root level as requested
✅ Security validations still in place (directory traversal prevention, etc.)

## Notes

- The `projectFolder` and `basePath` parameters are still required by `sanitizePath` for backward compatibility
- They're validated but not used in path construction
- This could be simplified in a future refactor if desired
