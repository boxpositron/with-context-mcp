# Path Usage Guidelines for with-context-mcp

## Overview

This document explains how to use paths correctly in with-context-mcp tools, especially for AI agents and subagents using the Task tool. Understanding path requirements is critical to avoid errors and ensure files are written to the correct location in the Obsidian vault.

## TL;DR - Quick Reference

**✅ CORRECT Usage:**

```
"docs/api.md"
"README.md"
"guides/tutorial.md"
"docs/api/users.md"
```

**❌ INCORRECT Usage (Will Be Rejected):**

```
"/Users/name/docs/api.md"          - Absolute path with leading /
"Users/name/docs/api.md"           - Looks like absolute filesystem path
"C:/Users/name/file.md"            - Windows absolute path
"home/user/file.md"                - Linux absolute path without leading /
"/home/user/file.md"               - Linux absolute path
```

## Core Concept: Project-Relative Paths Only

All path parameters in with-context-mcp tools **MUST** be relative to the project root. The system automatically handles the full vault path construction:

```
User Input:        "docs/api.md"
Project Context:   "my-project"
Base Path:         "Projects"
Final Vault Path:  "Projects/my-project/docs/api.md"
```

## Why Absolute Paths Are Rejected

1. **Security**: Absolute paths could write files anywhere on the filesystem
2. **Portability**: Code with absolute paths won't work on different machines
3. **Vault Organization**: All project files must be under the project folder in the vault
4. **Consistency**: Ensures predictable file locations for all users

## Path Resolution Process

The path validation system (src/security/path-validator.ts) processes paths through multiple security layers:

### Step 1: Reject Obviously Absolute Paths

```typescript
// These are rejected immediately
"/Users/name/file.md"       - Detected by path.isAbsolute()
"/home/user/file.md"        - Detected by path.isAbsolute()
"C:\\Users\\file.md"        - Detected by path.isAbsolute()
```

### Step 2: Detect Filesystem-Like Paths

Even without a leading slash, paths that start with common filesystem roots are rejected:

```typescript
// Rejected patterns:
"Users/..."          - macOS/Linux user directory
"home/..."           - Linux home directory
"mnt/..."            - Linux mount points
"usr/..."            - Linux system directory
"var/..."            - Linux variable data
"tmp/..."            - Temporary directory
"Library/..."        - macOS library
"Applications/..."   - macOS applications
"System/..."         - macOS/Windows system
"Volumes/..."        - macOS volumes
"Windows/..."        - Windows system
"Program Files/..."  - Windows programs
"opt/..."            - Linux optional software
```

### Step 3: Validate Security

```typescript
// Additional security checks:
- Directory traversal (../)
- Null bytes
- Home directory expansion (~/)
- Variable expansion (${...})
```

### Step 4: Construct Final Vault Path

```typescript
const vaultPath = `${basePath}/${projectFolder}/${cleanedPath}`;
// Example: "Projects/my-project/docs/api.md"
```

## Common Mistakes and Fixes

### Mistake 1: Using Full Filesystem Paths

**❌ Wrong:**

```typescript
writeNote({
  path: 'Users/davidibia/Projects/my-app/docs/api.md',
  content: '...',
});
```

**✅ Correct:**

```typescript
writeNote({
  path: 'docs/api.md',
  content: '...',
});
```

**Error Message You'll See:**

```
Path appears to be an absolute filesystem path starting with "Users/".

Use project-relative paths only, such as:
  ✓ "docs/guide.md" (correct)
  ✓ "README.md" (correct)
  ✗ "Users/davidibia/Projects/my-app/docs/api.md" (incorrect - appears absolute)

Suggested fix: Try "my-app/docs/api.md" instead.
```

### Mistake 2: Including Project Name in Path

**❌ Wrong:**

```typescript
writeNote({
  path: 'my-project/docs/api.md', // Project name is redundant
  content: '...',
});
```

**✅ Correct:**

```typescript
writeNote({
  path: 'docs/api.md', // Project context is automatic
  content: '...',
});
```

### Mistake 3: Absolute Paths from Code Analysis

When AI agents analyze local files, they might extract absolute paths:

**❌ Wrong:**

```typescript
// Agent found this file path:
const filePath = '/Users/davidibia/Projects/my-app/src/index.ts';

// And tries to create docs for it:
writeNote({
  path: filePath.replace(/\.ts$/, '.md'), // Still absolute!
  content: '...',
});
```

**✅ Correct:**

```typescript
// Agent found this file path:
const filePath = '/Users/davidibia/Projects/my-app/src/index.ts';
const projectRoot = '/Users/davidibia/Projects/my-app';

// Extract relative path:
const relativePath = filePath.replace(projectRoot + '/', '');
// Result: "src/index.ts"

// Use relative path:
writeNote({
  path: relativePath.replace(/\.ts$/, '.md'), // "src/index.md"
  content: '...',
});
```

## Tool-Specific Guidelines

### write_note / batch_write_notes

```typescript
// ✅ Good
await writeNote({
  path: 'CHANGELOG.md',
  content: '# Changelog\n...',
  mode: 'overwrite',
});

await writeNote({
  path: 'docs/api/users.md',
  content: '# Users API\n...',
  mode: 'create',
});

// ❌ Bad
await writeNote({
  path: '/Users/me/CHANGELOG.md', // Absolute
  content: '...',
});

await writeNote({
  path: 'Users/me/docs/api.md', // Looks absolute
  content: '...',
});
```

### read_note

```typescript
// ✅ Good
const content = await readNote({
  path: 'docs/api.md',
});

// ❌ Bad
const content = await readNote({
  path: '/Users/me/docs/api.md', // Absolute
});
```

### delete_note

```typescript
// ✅ Good
await deleteNote({
  path: 'old-docs/deprecated.md',
  confirm: true,
});

// ❌ Bad
await deleteNote({
  path: 'Users/me/old-docs/deprecated.md', // Looks absolute
  confirm: true,
});
```

### get_note_metadata

```typescript
// ✅ Good
const metadata = await getNoteMetadata({
  path: 'docs/api.md',
});

// ❌ Bad
const metadata = await getNoteMetadata({
  path: 'C:/Projects/docs/api.md', // Windows absolute
});
```

## For AI Agents: Path Extraction Best Practices

### When Analyzing Local Files

```typescript
// 1. Get the project root (from context or detection)
const projectRoot = '/Users/davidibia/Projects/my-app';

// 2. When finding files to document, extract relative paths
const files = [
  '/Users/davidibia/Projects/my-app/src/index.ts',
  '/Users/davidibia/Projects/my-app/src/api/users.ts',
];

// 3. Convert to relative paths
const relativePaths = files.map((file) => {
  // Remove project root prefix
  return file.replace(projectRoot + '/', '');
});
// Result: ["src/index.ts", "src/api/users.ts"]

// 4. Use relative paths for documentation
for (const relativePath of relativePaths) {
  const docPath = relativePath.replace(/\.(ts|js)$/, '.md');
  await writeNote({
    path: `docs/${docPath}`, // e.g., "docs/src/index.md"
    content: generateDocs(relativePath),
  });
}
```

### Path Validation Helper

```typescript
/**
 * Validates if a path is project-relative (for AI agents)
 */
function isProjectRelativePath(path: string): boolean {
  // Check for absolute path indicators
  const absoluteIndicators = [
    /^\//, // Unix absolute
    /^[A-Z]:[/\\]/, // Windows absolute
    /^Users\//i, // Likely absolute without /
    /^home\//i, // Linux home
    /^mnt\//i, // Linux mount
    /^usr\//i, // Linux system
    /^var\//i, // Linux var
    /^tmp\//i, // Temp
    /^Library\//i, // macOS
    /^Applications\//i, // macOS
    /^Windows\//i, // Windows
    /^Program Files/i, // Windows
  ];

  return !absoluteIndicators.some((pattern) => pattern.test(path));
}

// Usage in AI agent:
const userProvidedPath = 'docs/api.md';
if (!isProjectRelativePath(userProvidedPath)) {
  throw new Error(
    `Invalid path "${userProvidedPath}". ` +
      `Use project-relative paths like "docs/api.md", not absolute paths.`
  );
}
```

## Error Messages Reference

### Absolute Path Error

```
Absolute paths are not allowed. Path must be relative to project folder.

Examples of correct usage:
  ✓ "docs/api.md"
  ✓ "README.md"
  ✓ "guides/tutorial.md"

Your path: "/Users/davidibia/docs/api.md"
Suggested fix: Try "docs/api.md" instead.
```

### Filesystem-Like Path Error

```
Path appears to be an absolute filesystem path starting with "Users/".

Use project-relative paths only, such as:
  ✓ "docs/guide.md" (correct)
  ✓ "README.md" (correct)
  ✗ "Users/davidibia/Projects/my-project/docs/api.md" (incorrect - appears absolute)

Suggested fix: Try "my-project/docs/api.md" instead.
```

### Directory Traversal Error

```
Path traversal detected. Path cannot navigate outside the project folder.
```

## Testing Your Paths

You can test path validation before using it:

```typescript
import { sanitizePath } from 'with-context-mcp/security';

try {
  const vaultPath = sanitizePath(
    'docs/api.md', // Your path
    'my-project', // Project folder
    'Projects' // Base path
  );
  console.log('Valid! Vault path:', vaultPath);
  // Output: "Valid! Vault path: Projects/my-project/docs/api.md"
} catch (error) {
  console.error('Invalid path:', error.message);
}
```

## Summary

**Golden Rules:**

1. Always use paths relative to the project root
2. Never include the project name in the path (it's added automatically)
3. Never use absolute filesystem paths
4. When analyzing local files, extract relative paths first
5. Test your paths before using them in batch operations

**Path Format:**

- ✅ `"docs/api.md"` - Simple relative path
- ✅ `"README.md"` - Root-level file
- ✅ `"guides/tutorials/intro.md"` - Nested path
- ❌ `"/Users/name/..."` - Absolute Unix path
- ❌ `"Users/name/..."` - Looks absolute
- ❌ `"C:/Users/..."` - Windows absolute
- ❌ `"my-project/docs/api.md"` - Includes project name (redundant)

**When in Doubt:**

- Remove everything before the project root
- Use simple, relative directory structure
- Start with well-known folders like `docs/`, `guides/`, etc.
- Never copy paths directly from filesystem tools
