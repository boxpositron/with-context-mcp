# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- Append/prepend implementation with duplicate code blocks removed

## [3.0.6] - 2024-01-15

### Added

- Prepend mode for `write_note` tool
- `update_frontmatter` tool with merge/replace modes
- Fuzzy finding in `list_notes` tool
- `replace_section` tool with three replacement modes

## [3.0.5] - 2024-01-10

### Added

- Auto-session management with automatic project detection
- `analyze_vault_structure` tool
- `generate_organization_plan` tool with 4 presets (clean, minimal, docs-as-code, research)
- `reorganize_notes` tool with rollback and automatic link updates

## [3.0.4] - 2024-01-08

### Fixed

- Broken links in README after documentation sync

## [3.0.2] - 2024-01-05

### Changed

- Removed `.withcontextignore` in favor of `.withcontextconfig.jsonc`
- `ingest_notes`, `sync_notes`, `teleport_notes` now use delegation config

## [3.0.1] - 2024-01-03

### Fixed

- Path resolution issue with Obsidian Local REST API
- Session storage path changed from `.sessions/` to `sessions/`

### Migration

- Rename `.sessions` → `sessions` in your vault (one-time only)

## [3.0.0] - 2024-01-01

### Added

- Session tools: `start_session`, `pause_session`, `resume_session`, `end_session`
- Todo tools: `add_todo`, `update_todo`, `list_todos`
- Changelog tools: `add_changelog_entry`, `get_session_changelog`, `get_commit_suggestion`
- Session state persistence in vault storage

## [2.1.0] - 2023-12-20

### Added

- Configuration tools: `setup_notes`, `validate_config`, `preview_delegation`
- Sync tools: `ingest_notes`, `sync_notes`, `teleport_notes`
- `.withcontextconfig.jsonc` for documentation delegation control

## [2.0.1] - 2023-12-15

### Fixed

- Minor bug fixes

## [2.0.0] - 2023-12-10

### Added

- Template system with `list_templates` and `create_from_template` tools
- `batch_write_notes` tool
- `get_note_metadata` tool
- Write modes: create, overwrite, append

### Breaking Changes

- Changed configuration format for environment variables
- Updated tool schemas

## [1.0.0] - 2023-12-01

### Added

- Core tools: `write_note`, `read_note`, `list_notes`, `search_notes`, `delete_note`
- Project-scoped note management with session context
- Path validation for security
- Obsidian REST API integration

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
