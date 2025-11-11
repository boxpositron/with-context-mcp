# Release v3.0.0

**Date:** 2025-11-10
**Type:** Major Feature Release

## Summary

Major release introducing complete session management system with todos, changelog tracking, and vault persistence. Adds 11 new MCP tools and updates OpenCode plugin to v3.0.0.

## Added

- Session lifecycle management (start, pause, resume, end) with vault persistence
- Todo management with priority levels and status tracking
- Changelog tracking with conventional commit support
- Automatic commit message generation from session data
- Cross-tool data persistence for todos and changelog entries
- Session archiving system organized by year-month
- 11 new MCP tools for session and todo/changelog management
- Updated OpenCode plugin with 25 native tools

## Changed

- Session state now persists to Obsidian vault
- Enhanced plugin performance with direct integration (no IPC overhead)

## Fixed

- None

## Technical Details

Introduced `SessionManager` class with vault-based storage, atomic writes with backup recovery, and singleton `sessionState` for tracking active sessions per project. Added comprehensive session workflow tests and documentation guides.
