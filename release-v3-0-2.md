# Release v3.0.2

**Date:** 2025-11-10
**Type:** Breaking Change

## Summary

Unify configuration system by removing `.withcontextignore` pattern files in favor of `.withcontextconfig.jsonc`.

## Changed

- Migrate `ingest_notes`, `sync_notes`, and `teleport_notes` to use `.withcontextconfig.jsonc` delegation system
- Consolidate all delegation decisions to single configuration file
- Update tool descriptions to reference `.withcontextconfig.jsonc`

## Removed

- Remove deprecated IgnoreConfig system (5 source files, 6 test files, 1200+ lines of code)
- Remove support for `.withcontextignore` pattern files
- Delete `src/doc-delegator/ignore-config.ts`
- Delete `src/doc-delegator/ignore-pattern-matcher.ts`
- Delete `src/doc-delegator/cli.ts`
- Delete `src/doc-delegator/read-interceptor.ts`
- Delete `src/doc-delegator/constants.ts`

## Fixed

- Eliminate confusion between two separate config systems
- Ensure consistent delegation behavior across all tools

## Breaking Changes

- Users must create `.withcontextconfig.jsonc` using `setup_notes()` tool
- Legacy `.withcontextignore` files no longer supported

## Technical Details

Simplified to single config file pattern for better maintainability and user experience. All tools now share same delegation decision logic.
