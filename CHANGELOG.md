# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Implemented vault-first documentation strategy with updated delegation configuration
- Moved development artifacts (design docs, test summaries, research notes) to vault
- Kept all README-referenced documentation local for easy access
- Restructured documentation with organized folder structure for better navigation
- Updated README to be more concise and skimmable, focusing on AI agent usage
- Removed all emojis for professional appearance

### Fixed

- Corrected append/prepend implementation by removing duplicate code blocks

## [3.0.6] - 2024-01-15

### Added

- Prepend mode for `write_note` tool to add content at the beginning of notes
- `update_frontmatter` tool for editing YAML frontmatter with merge/replace modes
- Fuzzy finding in `list_notes` tool with match highlighting
- `replace_section` tool for targeted section editing with three replacement modes
- Advanced note editing capabilities for precise documentation management
- OpenCode plugin with v3.0.6 feature support

### Fixed

- Append/prepend implementation by removing duplicate code blocks

## [3.0.5] - 2024-01-10

### Added

- Auto-session management for OpenCode plugin with intelligent session tracking
- Automatic project detection from git repository
- Smart file change analysis with changelog suggestions
- Vault organization features with intelligent analysis and automated reorganization
- 4 built-in presets: clean, minimal, docs-as-code, research
- Automatic categorization and folder statistics
- Safe file reorganization with rollback capability
- Automatic link updating when files move
- Orphan file detection and impact assessment

### Changed

- Excluded session management files from vault reorganization
- Streamlined slash commands and fixed plugin parameter handling
- Eliminated AI interpretation from OpenCode slash commands

### Fixed

- Health check tests to match current config validation behavior

## [3.0.4] - 2024-01-08

### Fixed

- Broken links in README after documentation sync
- Updated references to synced files (CHANGELOG.md, INTELLIGENT_SETUP_GUIDE.md)
- Files now correctly point to vault locations after setup

## [3.0.2] - 2024-01-05

### Changed

- Config system unification: removed `.withcontextignore` in favor of unified `.withcontextconfig.jsonc`
- All delegation decisions now use the config system
- `ingest_notes`, `sync_notes`, `teleport_notes` now use delegation config
- Simplified architecture with single source of truth
- Better conflict resolution and pattern matching

## [3.0.1] - 2024-01-03

### Fixed

- Path resolution issue with Obsidian Local REST API
- Changed session storage from `.sessions/` to `sessions/` for proper directory listing
- Migration note: Rename `.sessions` → `sessions` in your vault (one-time only)

## [3.0.0] - 2024-01-01

### Added

- Session persistence with full cross-tool data persistence
- Session management with complete lifecycle tracking (start/pause/resume/end)
- Todo management to track tasks with priorities and status across sessions
- Changelog tracking with semi-automatic changelog and conventional commit support
- Vault persistence for sessions, todos, and changelogs
- Session tools: `start_session`, `pause_session`, `resume_session`, `end_session`
- Todo tools: `add_todo`, `update_todo`, `list_todos`
- Changelog tools: `add_changelog_entry`, `get_session_changelog`, `get_commit_suggestion`

### Changed

- Session state now persists across tool calls in vault storage
- Todos and changelog entries survive tool restarts

## [2.1.0] - 2023-12-20

### Added

- Intelligent documentation setup with 4-phase analysis
- Repository analysis for project type detection
- README validation with link checking
- Smart delegation recommendations based on Diátaxis framework
- Configuration tools: `setup_notes`, `validate_config`, `preview_delegation`
- Documentation delegation control with `.withcontextconfig.jsonc`
- Conflict resolution for overlapping patterns
- Read interception for delegated docs with caching
- Bidirectional sync between local project and vault
- Sync tools: `ingest_notes`, `sync_notes`, `teleport_notes`

### Changed

- Improved configuration system with validation and preview capabilities

## [2.0.1] - 2023-12-15

### Fixed

- Minor bug fixes and improvements
- Documentation updates

## [2.0.0] - 2023-12-10

### Added

- Template system with professional templates
- Variable substitution in templates
- Batch write operations with `batch_write_notes`
- Metadata extraction with `get_note_metadata`
- Multiple write modes: create, overwrite, append
- Enhanced search capabilities

### Changed

- Improved error handling and validation
- Better project scoping with session context
- Enhanced security with path validation

### Breaking Changes

- Changed configuration format for environment variables
- Updated tool schemas for better type safety

## [1.0.0] - 2023-12-01

### Added

- Initial release
- Project-scoped note management for Obsidian
- Core tools: `write_note`, `read_note`, `list_notes`, `search_notes`, `delete_note`
- Session context for project isolation
- Security features with path validation
- Obsidian REST API integration
- Environment-based configuration

[Unreleased]: https://github.com/boxpositron/with-context-mcp/compare/v3.0.6...HEAD
[3.0.6]: https://github.com/boxpositron/with-context-mcp/compare/v3.0.5...v3.0.6
[3.0.5]: https://github.com/boxpositron/with-context-mcp/compare/v3.0.4...v3.0.5
[3.0.4]: https://github.com/boxpositron/with-context-mcp/compare/v3.0.2...v3.0.4
[3.0.2]: https://github.com/boxpositron/with-context-mcp/compare/v3.0.1...v3.0.2
[3.0.1]: https://github.com/boxpositron/with-context-mcp/compare/v3.0.0...v3.0.1
[3.0.0]: https://github.com/boxpositron/with-context-mcp/compare/v2.1.0...v3.0.0
[2.1.0]: https://github.com/boxpositron/with-context-mcp/compare/v2.0.1...v2.1.0
[2.0.1]: https://github.com/boxpositron/with-context-mcp/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/boxpositron/with-context-mcp/compare/v1.0.0...v2.0.0
[1.0.0]: https://github.com/boxpositron/with-context-mcp/releases/tag/v1.0.0
