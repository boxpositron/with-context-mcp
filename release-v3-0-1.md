# Release v3.0.1

**Date:** 2025-11-10
**Type:** Bug Fix

## Summary

Fix session storage path to avoid Obsidian API's hidden folder filtering issue.

## Changed

- Update session storage from `.sessions/` to `sessions/` directory
- Modify `SessionPaths` constants to use `sessions/` prefix

## Fixed

- Resolve directory listing issues with Obsidian Local REST API that filters hidden folders
- Enable session file discovery via directory traversal

## Breaking Changes

- Users must manually rename `.sessions` folders to `sessions` in their Obsidian vault

## Technical Details

The Obsidian API filters folders starting with `.` from directory listings, making `.sessions/` invisible to `listNotes()`. Session files are now stored in `Projects/{project}/sessions/` instead of `Projects/{project}/.sessions/`.
