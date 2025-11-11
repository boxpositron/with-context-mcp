# Path Validation and Tool Design Improvements

## Summary

This document summarizes the improvements made to path validation and tool design to prevent subagents from accidentally using absolute filesystem paths.

**Status:** ✅ All tests passing (372 tests), ✅ Build successful, ✅ Linting passed

## Problem Statement

Subagents using the Task tool were creating vault entries with paths like `Users/davidibia/Company/...` instead of project-relative paths like `docs/guide.md`. The tools should only accept project-relative paths, but the validation wasn't catching filesystem-like paths without leading slashes.

## Changes Made

### 1. Enhanced Path Validation (`src/security/path-validator.ts`)

#### Added Detection for 14 Common Filesystem Root Patterns

```typescript
const suspiciousPathPatterns = [
  /^Users\//i, // macOS/Linux user directory
  /^home\//i, // Linux home directory
  /^[A-Z]:\\/i, // Windows drive letter (backslash)
  /^[A-Z]:\//i, // Windows drive letter (forward slash)
  /^mnt\//i, // Linux mount points
  /^opt\//i, // Linux optional software
  /^usr\//i, // Linux system directory
  /^var\//i, // Linux variable data
  /^tmp\//i, // Temporary directory
  /^Library\//i, // macOS library
  /^Applications\//i, // macOS applications
  /^System\//i, // macOS/Windows system
  /^Volumes\//i, // macOS volumes
  /^Program Files/i, // Windows programs
  /^Windows\//i, // Windows system
];
```

#### Improved Error Messages

**Before:**

```
Path appears to be an absolute filesystem path. Please provide a path relative to your project folder.
```

**After:**

```
Path appears to be an absolute filesystem path starting with "Users/".

Use project-relative paths only, such as:
  ✓ "docs/guide.md" (correct)
  ✓ "README.md" (correct)
  ✗ "Users/davidibia/Projects/my-project/docs/api.md" (incorrect - appears absolute)

Suggested fix: Try "my-project/docs/api.md" instead.
```

The new error messages:

- Show the problematic pattern that was detected
- Provide concrete examples of correct usage
- Suggest a fix by extracting meaningful parts of the path
- Use visual indicators (✓ ✗) for clarity

### 2. Updated Tool Descriptions

Enhanced descriptions for all path-accepting tools to be crystal clear for AI agents:

**Files Updated:**

- `src/tools/write-note.ts`
- `src/tools/read-note.ts`
- `src/tools/delete-note.ts`
- `src/tools/get-note-metadata.ts`
- `src/tools/batch-write-notes.ts`

**Before:**

```typescript
'Relative path to the note within the project folder (e.g., "CHANGELOG.md" or "docs/api.md")';
```

**After:**

```typescript
'Project-relative path to the note. CORRECT: "CHANGELOG.md", "docs/api.md". ' +
  'INCORRECT: "/Users/name/file.md", "Users/name/file.md", "C:/path/file.md". ' +
  'Use paths relative to project root only, NOT absolute filesystem paths.';
```

### 3. Fixed Plugin Export Issues (`plugin/with-context.ts`)

Fixed incorrect import names:

- `reorganizeVaultHandler` → `reorganizeNotesHandler`
- Added missing `generateOrganizationPlanHandler` import
- Updated all usage references to match new names

### 4. Comprehensive Test Coverage (`tests/unit/path-validator.test.ts`)

Added 19 new tests (total: 32 tests, up from 13):

#### Filesystem Path Rejection Tests

- ✅ Rejects `Users/davidibia/docs/api.md`
- ✅ Rejects `home/user/documents/file.md`
- ✅ Rejects `C:\\Users\\docs\\api.md` (Windows backslash)
- ✅ Rejects `C:/Users/docs/api.md` (Windows forward slash)
- ✅ Rejects `mnt/drive/docs/file.md`
- ✅ Rejects `usr/local/docs/file.md`
- ✅ Rejects `var/www/docs/file.md`
- ✅ Rejects `tmp/temp/file.md`
- ✅ Rejects `Library/Application Support/file.md`
- ✅ Rejects `Applications/MyApp/file.md`
- ✅ Rejects `Windows/System32/file.md`
- ✅ Rejects `Program Files/App/file.md`

#### Valid Path Acceptance Tests

- ✅ Accepts `README.md`
- ✅ Accepts `docs/api.md`
- ✅ Accepts `guides/tutorial.md`
- ✅ Accepts `docs/api/users.md`
- ✅ Accepts `CHANGELOG.md`

#### Error Message Quality Tests

- ✅ Verifies helpful error for `Users/` paths
- ✅ Verifies helpful error for absolute paths

### 5. Created Comprehensive Documentation

**New File:** `docs/PATH_USAGE_GUIDELINES.md`

A comprehensive 400+ line guide covering:

- Quick reference for correct/incorrect usage
- Core concepts of project-relative paths
- Why absolute paths are rejected
- Step-by-step path resolution process
- Common mistakes and how to fix them
- Tool-specific guidelines for each path-accepting tool
- Best practices for AI agents extracting paths from code
- Helper functions for path validation
- Complete error message reference
- Testing examples

This documentation serves as:

- Reference for developers
- Training material for AI agents
- Debugging guide when path errors occur

## Test Results

### Path Validator Tests

```
✓ tests/unit/path-validator.test.ts (32 tests) 6ms
  ✓ Path Validator (32)
    ✓ sanitizePath (32)
      ✓ should sanitize valid relative paths under project folder
      ✓ should handle simple filenames under project folder
      ✓ should reject paths with directory traversal
      ✓ should reject absolute paths
      ✓ should reject empty paths
      ✓ should handle nested directories under project folder
      ✓ should slugify filenames with spaces
      ✓ should slugify filenames with special characters
      ✓ should slugify filenames with multiple spaces
      ✓ should preserve directory structure but slugify filename
      ✓ should handle filenames that already have .md extension
      ✓ should preserve case for well-known filenames like README
      ✓ should convert regular filenames to lowercase
      ✓ Filesystem path rejection (12)
        ✓ should reject paths starting with Users/
        ✓ should reject paths starting with home/
        ✓ should reject Windows drive letters (backslash)
        ✓ should reject Windows drive letters (forward slash)
        ✓ should reject paths starting with mnt/
        ✓ should reject paths starting with usr/
        ✓ should reject paths starting with var/
        ✓ should reject paths starting with tmp/
        ✓ should reject paths starting with Library/
        ✓ should reject paths starting with Applications/
        ✓ should reject paths starting with Windows/
        ✓ should reject paths starting with Program Files
      ✓ Valid project-relative paths (5)
        ✓ should accept simple filename
        ✓ should accept docs/api.md
        ✓ should accept guides/tutorial.md
        ✓ should accept nested paths like docs/api/users.md
        ✓ should accept CHANGELOG.md
      ✓ Error message quality (2)
        ✓ should provide helpful error message for Users/ path
        ✓ should provide helpful error message for absolute paths
```

### All Tests

```
Test Files  18 passed (18)
Tests       372 passed | 16 todo (388)
Duration    1.16s
```

### Build & Lint

```
✅ npm run build  - Successful (0 errors)
✅ npm run lint   - Successful (0 warnings)
✅ npm run format - Successful (all files formatted)
```

## Examples of Improved Error Messages

### Example 1: Users/ Path

**Input:** `Users/davidibia/Projects/my-project/docs/api.md`

**Error:**

```
Path appears to be an absolute filesystem path starting with "Users/".

Use project-relative paths only, such as:
  ✓ "docs/guide.md" (correct)
  ✓ "README.md" (correct)
  ✗ "Users/davidibia/Projects/my-project/docs/api.md" (incorrect - appears absolute)

Suggested fix: Try "my-project/docs/api.md" instead.
```

### Example 2: Absolute Unix Path

**Input:** `/Users/davidibia/docs/api.md`

**Error:**

```
Absolute paths are not allowed. Path must be relative to project folder.

Examples of correct usage:
  ✓ "docs/api.md"
  ✓ "README.md"
  ✓ "guides/tutorial.md"

Your path: "/Users/davidibia/docs/api.md"
Suggested fix: Try "docs/api.md" instead.
```

### Example 3: Windows Path

**Input:** `C:/Users/davidibia/file.md`

**Error:**

```
Path appears to be an absolute filesystem path starting with "C:/".

Use project-relative paths only, such as:
  ✓ "docs/guide.md" (correct)
  ✓ "README.md" (correct)
  ✗ "C:/Users/davidibia/file.md" (incorrect - appears absolute)

Suggested fix: Try "docs/guide.md" instead.
```

## Validation Examples

### ✅ Paths That Pass Validation

```typescript
sanitizePath('docs/api.md', 'my-project', 'Projects');
// → 'Projects/my-project/docs/api.md'

sanitizePath('README.md', 'my-project', 'Projects');
// → 'Projects/my-project/README.md'

sanitizePath('guides/tutorial.md', 'my-project', 'Projects');
// → 'Projects/my-project/guides/tutorial.md'
```

### ❌ Paths That Fail Validation

```typescript
sanitizePath('Users/davidibia/docs/api.md', ...)
// → Error: Path appears to be absolute...

sanitizePath('/Users/davidibia/docs/api.md', ...)
// → Error: Absolute paths are not allowed...

sanitizePath('home/user/docs/api.md', ...)
// → Error: Path appears to be absolute...

sanitizePath('C:/Users/file.md', ...)
// → Error: Path appears to be absolute...
```

## Impact on Subagents

### Before

Subagents could accidentally use filesystem paths:

```typescript
// AI agent analyzing files:
const filePath = "/Users/davidibia/Company/project/docs/api.md";

// Passes validation (incorrectly):
writeNote({ path: "Users/davidibia/Company/project/docs/api.md", ... });

// Result: Vault pollution with paths like:
// Projects/my-project/Users/davidibia/Company/project/docs/api.md
```

### After

Subagents receive clear errors and guidance:

```typescript
// AI agent analyzing files:
const filePath = "/Users/davidibia/Company/project/docs/api.md";

// Fails validation with helpful error:
writeNote({ path: "Users/davidibia/Company/project/docs/api.md", ... });
// Error: Path appears to be an absolute filesystem path...
//        Suggested fix: Try "project/docs/api.md" instead.

// Agent learns and uses correct path:
writeNote({ path: "docs/api.md", ... });
// Result: Projects/my-project/docs/api.md ✅
```

## Security Improvements

1. **Enhanced Pattern Matching**: Detects 14 different filesystem root patterns
2. **Smart Suggestions**: Extracts meaningful relative paths from invalid input
3. **Visual Feedback**: Uses ✓ and ✗ symbols for clarity
4. **Context-Aware**: Tries to identify project-like directories for better suggestions
5. **Comprehensive**: Covers Unix, Linux, macOS, and Windows filesystem patterns

## Documentation Quality

The new `PATH_USAGE_GUIDELINES.md` provides:

1. **Quick Reference**: TL;DR section with correct/incorrect examples
2. **Conceptual Understanding**: Explains why and how path resolution works
3. **Practical Examples**: Real-world scenarios and solutions
4. **Tool-Specific Guidance**: Per-tool usage examples
5. **AI Agent Helpers**: Code snippets for path extraction and validation
6. **Error Reference**: Complete guide to error messages
7. **Testing Examples**: How to validate paths before using them

## Files Changed

**Source Code:**

- `src/security/path-validator.ts` - Enhanced validation logic
- `src/tools/write-note.ts` - Improved descriptions
- `src/tools/read-note.ts` - Improved descriptions
- `src/tools/delete-note.ts` - Improved descriptions
- `src/tools/get-note-metadata.ts` - Improved descriptions
- `src/tools/batch-write-notes.ts` - Improved descriptions
- `plugin/with-context.ts` - Fixed exports and imports

**Tests:**

- `tests/unit/path-validator.test.ts` - Added 19 new tests

**Documentation:**

- `docs/PATH_USAGE_GUIDELINES.md` - New comprehensive guide (400+ lines)

## Recommendations for AI Agents

When using with-context-mcp tools:

1. **Always use project-relative paths**: `"docs/api.md"`, not `"/Users/.../docs/api.md"`
2. **Never include project name**: Path resolution adds it automatically
3. **Extract relative paths from filesystem paths**: Remove project root prefix
4. **Read error messages carefully**: They contain suggested fixes
5. **Consult PATH_USAGE_GUIDELINES.md**: For detailed examples and patterns

## Future Improvements

Potential enhancements for consideration:

1. **Auto-correction**: Automatically fix common path mistakes instead of just suggesting
2. **Path extraction helper**: Tool to convert filesystem paths to relative paths
3. **IDE integration**: Real-time validation in editors
4. **More patterns**: Add detection for other common filesystem structures
5. **Internationalization**: Support non-English filesystem paths

## Conclusion

These improvements make it virtually impossible for subagents to accidentally pollute the vault with filesystem paths. The combination of:

- Enhanced validation (14 patterns detected)
- Clear error messages with suggestions
- Comprehensive documentation
- Tool description improvements
- Extensive test coverage (32 tests)

...ensures that path usage is consistent, secure, and easy to understand for both human developers and AI agents.

**All tests passing ✅**
**Build successful ✅**
**Linting passed ✅**
**Ready for deployment ✅**
