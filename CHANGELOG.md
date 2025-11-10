# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.1] - 2025-11-10

### Fixed

- **Path Resolution Bug**: Changed session storage from `.sessions/` to `sessions/` to fix directory listing issues with Obsidian Local REST API
  - The Obsidian API filters hidden folders (starting with `.`) from directory listings, making `.sessions/` invisible to `listNotes()`
  - Session files can still be accessed directly but cannot be discovered via directory traversal
  - Sessions are now stored in `Projects/{project}/sessions/` instead of `Projects/{project}/.sessions/`
  - **Migration**: Users need to manually rename their `.sessions` folders to `sessions` in their Obsidian vault

### Changed

- Updated `SessionPaths` constants to use `sessions/` prefix
- Updated tests to reflect new session storage paths

## [3.0.0] - 2025-11-10

### Added

#### Session Management System

- **Session Lifecycle Management** - Complete start/pause/resume/end workflow with vault persistence
- **Cross-Tool Data Persistence** - Todos and changelog entries survive across tool invocations
- **Session State Tracking** - Singleton `sessionState` maintains active session IDs per project
- **Vault-Based Storage** - Atomic writes with backup recovery to Obsidian vault
- **Session Archiving** - Automatic archiving of completed sessions organized by year-month
- **loadSession Method** - Load sessions without changing their status (for pause/end operations)

#### Todo Management

- **Priority Levels** - High, medium, and low priority support
- **Status Tracking** - Pending, in_progress, completed, and cancelled states
- **Persistence** - Todos persist across sessions and tool calls
- **Filtering** - List todos by status and/or priority
- **Automatic Timestamps** - Track creation and completion times

#### Changelog Tracking

- **Conventional Commits** - Support for feature, fix, refactor, docs, test, chore types
- **Breaking Changes** - Flag breaking changes in changelog entries
- **Commit Generation** - Automatically generate conventional commit messages from session data
- **File Tracking** - Associate changelog entries with affected files
- **Semi-Automatic Tracking** - User provides type and message, system handles metadata

#### MCP Tools

- `start_session` - Start a new development session with vault persistence
- `pause_session` - Pause the current active session
- `resume_session` - Resume a paused session (with optional session_id)
- `end_session` - Complete and archive the current session
- `get_session_status` - View comprehensive session details
- `add_changelog_entry` - Add a changelog entry to current session
- `get_session_changelog` - View changelog entries grouped by type
- `get_commit_suggestion` - Generate conventional commit message
- `add_todo` - Add a todo with priority to current session
- `update_todo` - Update todo status or priority
- `list_todos` - List todos with optional filters

#### OpenCode Plugin

- **Plugin v3.0.0** - Updated to match MCP server version
- **25 Native Tools** - All MCP tools available as native OpenCode tools
- **Direct Integration** - Runs inside OpenCode (no separate server process)
- **Enhanced Performance** - No IPC overhead for better responsiveness
- **Code Reuse** - Plugin wraps MCP handlers for consistency

#### Documentation

- **Session Management Guide** (`docs/CHANGELOG_TODO_GUIDE.md`) - Complete guide for session, changelog, and todo features
- **Plugin Auto-Tracking Roadmap** (`docs/PLUGIN_AUTO_TRACKING.md`) - Future auto-tracking implementation plan
- **Session Workflow Tests** (`tests/integration/SESSION_WORKFLOW_TEST_SUMMARY.md`) - Integration test documentation

### Fixed

#### Session Persistence

- **Session state not persisting across tool calls** - Added `sessionState.activeSessionIds` Map to track sessions
- **Vault-first loading** - All tools now load sessions from vault using tracked IDs
- **Session continuity** - Sessions created by `start_session` are now accessible by subsequent tools

#### Path Construction

- **Double slash bug in vault paths** - Fixed path construction for absolute project folders
- **Path normalization** - Added `extractProjectName()` helper to handle both absolute and relative paths
- **Vault path format** - Ensures consistent `Projects/project-name/.sessions/` structure

#### Session Loading

- **"Cannot resume session in active state" errors** - Added `loadSession()` method for status-preserving reads
- **Pause/end operations** - Now work correctly with active sessions
- **Project context** - Added `setProjectFolder()` method to SessionManager

#### Error Handling

- **Enhanced error messages** - Better error reporting throughout vault persistence layer
- **Temp file write failures** - Detailed error messages for atomic write steps
- **JSON parsing errors** - Clear error messages for malformed session data
- **Validation errors** - Improved Zod schema validation error messages
- **Backup recovery logging** - Added console logging for backup operations

### Changed

- **Unified setup-notes tool** - Merged `setup-notes-new.ts` into enhanced `setup-notes.ts`
- **Session paths** - Uses `SessionPaths` helper for consistent path construction
- **Resume session logic** - Gets session ID from `sessionState` if not provided
- **Error propagation** - Errors are no longer silently swallowed in vault operations

### Removed

- **Legacy `.withcontextignore` support** - Use `.withcontextconfig.jsonc` instead (BREAKING CHANGE)
- **Legacy ignore parser** (`src/config/legacy-ignore-parser.ts`) - 129 lines removed
- **Migration tool** (`src/tools/migrate-config.ts`) - 249 lines removed
- **Legacy migration tests** (`tests/unit/legacy-migration.test.ts`) - 252 lines removed
- **Old setup-notes variant** (`src/tools/setup-notes-new.ts`) - 339 lines removed

### Testing

- **356 tests passing** - Across 16 test files
- **23 integration tests** - For session workflow (7 passing + 16 documented)
- **27 SessionManager tests** - Comprehensive unit tests for session manager
- **Real-world verification** - Tested with actual Obsidian vault
- **Integration test suite** - `tests/integration/session-workflow.test.ts` added

### Migration Guide

If upgrading from v2.x:

1. **Configuration**: Ensure you're using `.withcontextconfig.jsonc` (legacy `.withcontextignore` no longer supported)
2. **No Breaking Changes for Users**: All existing tools work as before
3. **New Features Available**: Start using session management, todos, and changelog tracking
4. **Plugin Update**: Update OpenCode plugin to v3.0.0 if using OpenCode

### Package Changes

- **Package size**: 160.8 kB (227 files)
- **Lines added**: 7,093
- **Lines removed**: 3,160
- **Net change**: +3,933 lines

## [2.1.0] - 2024-11-09

### Added

#### Intelligent Documentation Analyzer

- **Repository Scanner** - Automatically detects project type (MCP server, library, monorepo, CLI, web app)
- **README Health Scoring** - Analyzes README completeness with 0-100 health score
- **Link Validation** - Validates all markdown links and prevents broken references to vault files
- **Smart Recommendations** - Generates context-aware LOCAL vs VAULT delegation patterns based on project analysis
- **Documentation Categorization** - Automatically categorizes docs (guides, tutorials, architecture, ADRs, research, etc.)

#### Enhanced Setup-Notes Command

- **4-Phase Intelligent Workflow**:
  1. Repository Analysis - Scans project structure and documentation
  2. README Validation - Checks completeness, links, and self-containment
  3. Intelligent Recommendations - Suggests optimal documentation architecture
  4. Configuration & Setup - Creates smart .withcontextconfig.jsonc
- **Diátaxis Framework Integration** - Organizes docs as tutorials, guides, reference, and explanation
- **Architecture Decision Records (ADR) Support** - Suggests ADR folder structure
- **README Self-Containment** - Ensures README works without vault dependencies
- **Actionable Feedback** - Provides specific fixes for README issues

#### Development & Quality

- **Pre-push Hook** - Automatically runs tests and build before pushing
- **OpenCode Configuration** - Enhanced with autoupdate, share, and instructions fields
- **AGENTS.md** - Simplified coding agent guidelines (from 137 to 34 lines)

### Changed

#### Documentation Delegation Philosophy

- **LOCAL (Repository)** - Essential files for onboarding and quick reference
  - README.md, CONTRIBUTING.md, LICENSE, AGENTS.md
  - Inline code documentation (src/\*\*/\*.md)
  - Quick reference guides
- **VAULT (Obsidian)** - Deep research and detailed exploration
  - Detailed guides and tutorials
  - Architecture documentation and ADRs
  - Research notes and investigations
  - Meeting notes

#### Configuration Format

- `.withcontextconfig.jsonc` now generated based on actual repository analysis
- Comments include detected project type and name
- Patterns tailored to project structure (not generic templates)

### Improved

- **README Documentation** - Comprehensive update for v2.1.0 features
- **Command Documentation** - Updated /setup-notes with intelligent analysis details
- **Code Formatting** - Standardized across codebase with Prettier
- **Type Safety** - Strict TypeScript throughout

### Removed

- **Legacy Configuration Files** - Removed .withcontextignore and .withcontextignore.template (migrated to new format)
- **Build Artifacts** - Removed plugin/dist/ from version control

### Fixed

- **Trailing Commas** - Fixed JSONC syntax in configuration files
- **Whitespace** - Normalized indentation (tabs to spaces)
- **Link Validation** - Prevents README from linking to files that will move to vault

### Technical Details

#### New Modules

- `src/doc-analyzer/types.ts` - Type definitions for analysis
- `src/doc-analyzer/repo-scanner.ts` - Project structure scanner
- `src/doc-analyzer/readme-analyzer.ts` - README validation and scoring
- `src/doc-analyzer/recommendation-engine.ts` - Intelligent recommendations
- `src/doc-analyzer/index.ts` - Orchestration layer

#### Dependencies

- Added `with-context-mcp@^2.1.0` to dependencies for plugin support
- Updated `glob@^11.0.3` for improved file scanning

#### Testing

- All 344 tests passing across 15 test files
- Pre-push hook ensures quality before pushing
- Test coverage maintained

### Documentation

#### Best Practices Applied

- **Diátaxis Framework** - Tutorials, guides, reference, explanation organization
- **ADR Pattern** - Architecture Decision Records support
- **Docs-as-Code** - Markdown format, version controlled, CI/CD integration
- **README Best Practices** - Self-contained, complete, valid links

### Migration Guide

#### From v2.0.x to v2.1.0

1. **Automatic Migration** - Legacy `.withcontextignore` files are automatically migrated
2. **New Configuration** - Review generated `.withcontextconfig.jsonc`
3. **README Validation** - Fix any link issues highlighted by the analyzer
4. **Folder Structure** - Consider adopting suggested vault folder structure

#### Breaking Changes

- None - Legacy format still supported via automatic migration

### Contributors

- David Ibia (@boxpositron)

---

## [2.0.2] - 2024-11-06

### Changed

- Read-before-write enforcement for existing files to prevent data loss
- Updated sync-notes and ingest-notes to comply with enforcement

### Fixed

- Data loss prevention in write operations

---

## [2.0.0] - 2024-11-02

### Added

- Initial release with .withcontextconfig.jsonc format
- Vault and local pattern arrays
- Conflict resolution strategies
- JSON schema support

---

[2.1.0]: https://github.com/boxpositron/with-context-mcp/compare/v2.0.2...v2.1.0
[2.0.2]: https://github.com/boxpositron/with-context-mcp/compare/v2.0.0...v2.0.2
[2.0.0]: https://github.com/boxpositron/with-context-mcp/releases/tag/v2.0.0
