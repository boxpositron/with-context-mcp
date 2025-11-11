# Release v3.0.3

**Date:** 2025-11-10
**Type:** Bug Fix (Reverted in v3.0.4)

## Summary

Attempted to simplify path handling by creating files at vault root instead of nested under project folders. This change broke expected project folder organization and was reverted in v3.0.4.

## Changed

- Modify path construction to create files at vault root instead of project-specific folders
- Update `sanitizePath()` to return clean paths without prepending base path and project folder

## Fixed

- None (this release introduced a regression)

## Breaking Changes

- Files created at vault root regardless of `project_folder` parameter
- Break project folder organization structure

## Technical Details

Modified `src/security/path-validator.ts` to remove basePath/projectFolder prepending from vault path construction. All security validations (directory traversal prevention, absolute path rejection, null byte detection) remained intact.

**Status:** Superseded by v3.0.4
